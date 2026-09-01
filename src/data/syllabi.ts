export interface Subtopic {
  title: string;
  competencies: string[];
  learningActivities?: string[] | Record<string, string[]>;
  expectedStandard?: string | string[];
  knowledge?: string;
  skills?: string;
  values?: string;
}

export const COMMON_LEARNING_ACTIVITIES = [
  "Small group discussions",
  "Role-playing",
  "Peer teaching",
  "Hands-on experiments",
  "Field trips/observations",
  "Case studies",
  "Project-based learning",
  "Brainstorming",
  "Debates",
  "Storytelling",
  "Drawing/Illustrating",
  "Singing/Chanting",
  "Games and simulations",
  "Digital research",
  "Solving problems individually",
  "Reciting poems",
  "Answering oral questions",
  "Writing in exercise books"
];

export interface Topic {
  title: string;
  generalCompetency?: string;
  subtopics: Subtopic[];
}

import { integratedScienceGrade1, integratedScienceGrade2, integratedScienceGrade3, integratedScienceGrade3CBC, integratedScienceGrade4, integratedScienceGrade5, integratedScienceGrade6, integratedScienceGrade7 } from './integratedScienceData';
import { 
  engZambianPlaceholder, 
  englishGrade1CBC,
  zambianLangGrade1Unpacked,
  englishGrade2CBC,
  zambianLangGrade2Unpacked,
  englishGrade3CBC,
  englishGrade3OBC,
  zambianLangGrade3Unpacked,
  englishGrade4CBC,
  zambianLangGrade4Unpacked,
  englishGrade5CBC,
  englishGrade5OBC,
  zambianLangGrade5Unpacked,
  englishGrade6CBC,
  englishGrade6OBC,
  zambianLangGrade6Unpacked,
  englishGrade7CBC,
  englishGrade7OBC,
  zambianLangGrade7Unpacked,
  englishGrade1Oral,
  englishGrade1Literacy,
  englishGrade2Oral,
  englishGrade2Literacy,
  eceEnglishSectionA,
  eceEnglishSectionB,
  eceZambianLanguageSectionA,
  eceZambianLanguageSectionB
} from './obeEnglishZambianData';
import { biologyForm1, biologyForm2, biologyForm3, biologyForm4 } from './biologySecondaryData';
import { chemistryForm1, chemistryForm2, chemistryForm3, chemistryForm4 } from './chemistrySecondaryData';
import { civicEducationForm1, civicEducationForm2, civicEducationForm3, civicEducationForm4 } from './civicEducationSecondaryData';
import { commerceForm1, commerceForm2, commerceForm3, commerceForm4 } from './commerceSecondaryData';
import { principlesOfAccountsForm1, principlesOfAccountsForm2, principlesOfAccountsForm3, principlesOfAccountsForm4 } from './principlesOfAccountsSecondaryData';
import { computerScienceForm1, computerScienceForm2, computerScienceForm3, computerScienceForm4 } from './computerScienceSecondaryData';
import { englishLanguageForm1, englishLanguageForm2, englishLanguageForm3, englishLanguageForm4 } from './englishSecondaryData';
import { foodNutritionForm1, foodNutritionForm2, foodNutritionForm3, foodNutritionForm4 } from './foodNutritionSecondaryData';
import { geographyForm1, geographyForm2, geographyForm3, geographyForm4 } from './geographySecondaryData';
import { historyForm1, historyForm2, historyForm3, historyForm4 } from './historySecondaryData';
import { hospitalityManagementForm1, hospitalityManagementForm2, hospitalityManagementForm3, hospitalityManagementForm4 } from './hospitalitySecondaryData';
import { ictForm1, ictForm2, ictForm3, ictForm4 } from './ictSecondaryData';
import { literatureForm1, literatureForm2, literatureForm3, literatureForm4 } from './literatureSecondaryData';
import { mathematics1Form1, mathematics1Form2, mathematics1Form3, mathematics1Form4 } from './mathematics1SecondaryData';
import { mathematics2Form1, mathematics2Form2, mathematics2Form3, mathematics2Form4 } from './mathematics2SecondaryData';
import { musicArtsForm1, musicArtsForm2, musicArtsForm3, musicArtsForm4 } from './musicArtsSecondaryData';
import { physicalEducationForm1, physicalEducationForm2, physicalEducationForm3, physicalEducationForm4 } from './physicalEducationSecondaryData';
import { physicsForm1, physicsForm2, physicsForm3, physicsForm4 } from './physicsSecondaryData';
import { religiousEducationForm1, religiousEducationForm2, religiousEducationForm3, religiousEducationForm4 } from './religiousEducationSecondaryData';
import { travelTourismForm1, travelTourismForm2, travelTourismForm3, travelTourismForm4 } from './travelTourismSecondaryData';
import { zambianLanguagesForm1, zambianLanguagesForm2, zambianLanguagesForm3, zambianLanguagesForm4 } from './zambianLanguagesSecondaryData';
import { frenchLanguageForm1, frenchLanguageForm2, frenchLanguageForm3, frenchLanguageForm4 } from './frenchLanguageSecondaryData';
import { agricultureScienceForm1, agricultureScienceForm2, agricultureScienceForm3, agricultureScienceForm4 } from './agricultureScienceSecondaryData';
import {
  zambianLangGrade1OBC,
  zambianLangGrade2OBC,
  zambianLangGrade3OBC,
  zambianLangGrade4OBC,
  zambianLangGrade5OBC,
  zambianLangGrade6OBC,
  zambianLangGrade7OBC
} from './zambianLanguagesOBCData';
import { artDesignForm1, artDesignForm2, artDesignForm3, artDesignForm4 } from './artDesignSecondaryData';
import { designTechnologyForm1, designTechnologyForm2, designTechnologyForm3, designTechnologyForm4 } from './designTechnologySecondaryData';
import { fashionFabricsForm1, fashionFabricsForm2, fashionFabricsForm3, fashionFabricsForm4 } from './fashionFabricsSecondaryData';
import { 
  eceCreativeTechSectionA, 
  eceCreativeTechSectionB, 
  obeCreativeTechGrade1, 
  obeCreativeTechGrade2, 
  obeCreativeTechGrade3, 
  obeCreativeTechGrade4, 
  obeCreativeTechGrade5, 
  obeCreativeTechGrade6, 
  obeCreativeTechGrade7 
} from './obeCreativeTechData';
import { socialStudiesGrade1, socialStudiesGrade2, socialStudiesGrade3, socialStudiesGrade4, socialStudiesGrade5, socialStudiesGrade6, socialStudiesGrade7 } from './obeSocialStudiesData';
import { obcSocialStudiesGrade3, obcSocialStudiesGrade4, obcSocialStudiesGrade5, obcSocialStudiesGrade6, obcSocialStudiesGrade7 } from './obcSocialStudiesData';
import { obcTechnologyGrade1, obcTechnologyGrade2, obcTechnologyGrade3, obcTechnologyGrade4, obcTechnologyGrade5, obcTechnologyGrade6, obcTechnologyGrade7 } from './obcTechnologyData';
import { homeEconomicsGrade4, homeEconomicsHospitalityGrade4 as oldHEHGrade4, homeEconomicsGrade5, homeEconomicsGrade6, homeEconomicsGrade7 } from './obeHomeEconomicsData';
import { homeEconomicsHospitalityGrade4, homeEconomicsHospitalityGrade5, homeEconomicsHospitalityGrade6 } from './obeHomeEconomicsHospitalityData';
import { cbcHomeEconomicsHospitalityGrade7 } from './cbcHomeEconomicsData';
import { expressiveArtsGrade4, expressiveArtsGrade5, expressiveArtsGrade6, expressiveArtsGrade7 } from './obeExpressiveArtsData';
import { mathOBCGrade1, mathOBCGrade4, mathOBCGrade5, mathOBCGrade6, mathOBCGrade7 } from './mathematicsData';
import { englishGrade4OBC, scienceGrade4OBC, socialStudiesGrade4OBC } from './grade4OBCData';
import { ecePreMathematicsSectionA, ecePreMathematicsSectionB, eceSocialEmotionalSectionA, eceSocialEmotionalSectionB } from './eceData';
import { obcHomeEconomicsGrade10, obcHomeEconomicsGrade11, obcHomeEconomicsGrade12 } from './obcHomeEconomicsData';
import { obcCivicEducationGrade10, obcCivicEducationGrade11, obcCivicEducationGrade12 } from './obcCivicEducationData';
import { obcComputerStudiesGrade10, obcComputerStudiesGrade11, obcComputerStudiesGrade12 } from './obcComputerStudiesData';
import { obcAdditionalMathGrade10, obcAdditionalMathGrade11, obcAdditionalMathGrade12 } from './obcAdditionalMathData';
import { obcBiologyGrade10, obcBiologyGrade11, obcBiologyGrade12 } from './obcBiologyData';
import { obcRE2044Grade10, obcRE2044Grade11, obcRE2044Grade12 } from './obcRE2044Data';
import { obcEnglishGrade10, obcEnglishGrade11, obcEnglishGrade12 } from './obcEnglishData';
import { obcZambianLanguagesGrade10, obcZambianLanguagesGrade11, obcZambianLanguagesGrade12 } from './obcZambianLanguagesData';
import { obcChemistryGrade10, obcChemistryGrade11, obcChemistryGrade12 } from './obcChemistryData';
import { obcPhysicsGrade10, obcPhysicsGrade11, obcPhysicsGrade12 } from './obcPhysicsData';
import { advancedCivicEducationForm5, advancedCivicEducationForm6 } from './advancedCivicEducationData';
import { advancedDesignTechnologyForm5, advancedDesignTechnologyForm6 } from './advancedDesignTechnologyData';
import { advancedEconomicsForm5, advancedEconomicsForm6 } from './advancedEconomicsData';
import { advancedEnglishLanguageForm5, advancedEnglishLanguageForm6 } from './advancedEnglishLanguageData';
import { advancedNutritionFoodTechForm5, advancedNutritionFoodTechForm6 } from './advancedNutritionFoodTechData';
import { advancedGeographyForm5, advancedGeographyForm6 } from './advancedGeographyData';
import { advancedHistoryForm5, advancedHistoryForm6 } from './advancedHistoryData';
import { advancedHospitalityForm5, advancedHospitalityForm6 } from './advancedHospitalityData';
import { advancedLiteratureEnglishForm5, advancedLiteratureEnglishForm6 } from './advancedLiteratureEnglishData';
import { advancedLiteratureZambianForm5, advancedLiteratureZambianForm6 } from './advancedLiteratureZambianData';
import { advancedMathematicsForm5, advancedMathematicsForm6 } from './advancedMathematicsData';
import { advancedReligiousEducationForm5, advancedReligiousEducationForm6 } from './advancedReligiousEducationData';
import { advancedPhysicsForm5, advancedPhysicsForm6 } from './advancedPhysicsData';
import { advancedBiologyForm5, advancedBiologyForm6 } from './advancedBiologyData';
import { advancedChemistryForm5, advancedChemistryForm6 } from './advancedChemistryData';
import { advancedComputerScienceForm5, advancedComputerScienceForm6 } from './advancedComputerScienceData';
import { advancedArtDesignForm5, advancedArtDesignForm6 } from './advancedArtDesignData';
import { advancedBusinessStudiesForm5, advancedBusinessStudiesForm6 } from './advancedBusinessStudiesData';
import { advancedAgriculturalScienceForm5, advancedAgriculturalScienceForm6 } from './advancedAgriculturalScienceData';
import { advancedFrenchForm5, advancedFrenchForm6 } from './advancedFrenchData';
import { advancedPhysicalEducationForm5, advancedPhysicalEducationForm6 } from './advancedPhysicalEducationData';
import { advancedTextileDesignForm5, advancedTextileDesignForm6 } from './advancedTextileDesignData';
import { advancedTravelTourismForm5, advancedTravelTourismForm6 } from './advancedTravelTourismData';
import { advancedMusicalArtsForm5, advancedMusicalArtsForm6 } from './advancedMusicalArtsData';

export const SYLLABI: Record<string, Record<string, Topic[]>> = {
  "ECE level 1": {
    "Creative and technology studies": eceCreativeTechSectionA,
    "Zambian language": eceZambianLanguageSectionA,
    "English": eceEnglishSectionA,
    "Pre-Mathematics & Science": ecePreMathematicsSectionA,
    "Social, Emotional and Spiritual Development": eceSocialEmotionalSectionA
  },
  "ECE level 2": {
    "Creative and technology studies": eceCreativeTechSectionB,
    "Zambian language": eceZambianLanguageSectionB,
    "English": eceEnglishSectionB,
    "Pre-Mathematics & Science": ecePreMathematicsSectionB,
    "Social, Emotional and Spiritual Development": eceSocialEmotionalSectionB
  },
  "Grade 1 (CBC)": {
    "Mathematics and science": integratedScienceGrade1,
    "Creative and technology studies": obeCreativeTechGrade1,
    "Zambian language": zambianLangGrade1Unpacked,
    "English": englishGrade1CBC,
    "literacy in English": englishGrade1Literacy,
    "Oral English": englishGrade1Oral
  },
  "Grade 2 (CBC)": {
    "Mathematics and science": integratedScienceGrade2,
    "Creative and technology studies": obeCreativeTechGrade2,
    "Zambian language": zambianLangGrade2Unpacked,
    "English": englishGrade2CBC,
    "literacy in English": englishGrade2Literacy,
    "Oral English": englishGrade2Oral
  },
  "Grade 3 (CBC)": {
    "Mathematics and science": integratedScienceGrade3CBC,
    "Creative and technology studies": obeCreativeTechGrade3,
    "Zambian language": zambianLangGrade3Unpacked,
    "English": englishGrade3CBC
  },
  "Grade 4 (CBC)": {
    "English": englishGrade4CBC,
    "Zambian language": zambianLangGrade4Unpacked,
    "Integrated science": integratedScienceGrade4,
    "Social studies": socialStudiesGrade4,
    "Creative and technology studies": obeCreativeTechGrade4,
    "Home Economics and Hospitality": homeEconomicsHospitalityGrade4,
    "Expressive Arts": expressiveArtsGrade4,
    "Mathematics": mathOBCGrade4
  },
  "Grade 5 (CBC)": {
    "English": englishGrade5CBC,
    "Zambian language": zambianLangGrade5Unpacked,
    "Integrated science": integratedScienceGrade5,
    "Social studies": socialStudiesGrade5,
    "Creative and technology studies": obeCreativeTechGrade5,
    "Home Economics and Hospitality": homeEconomicsHospitalityGrade5,
    "Expressive Arts": expressiveArtsGrade5,
    "Mathematics": mathOBCGrade5
  },
  "Grade 6 (CBC)": {
    "English": englishGrade6CBC,
    "Zambian language": zambianLangGrade6Unpacked,
    "Integrated science": integratedScienceGrade6,
    "Social studies": socialStudiesGrade6,
    "Creative and technology studies": obeCreativeTechGrade6,
    "Home Economics and Hospitality": homeEconomicsHospitalityGrade6,
    "Expressive Arts": expressiveArtsGrade6,
    "Mathematics": mathOBCGrade6
  },
  "Grade 7 (CBC)": {
    "English": englishGrade7CBC,
    "Zambian language": zambianLangGrade7Unpacked,
    "Integrated science": integratedScienceGrade7,
    "Social studies": socialStudiesGrade7,
    "Creative and technology studies": obeCreativeTechGrade7
  },
  "Grade 1 (OBC)": {
    "Integrated science": integratedScienceGrade1,
    "Creative and Technology Studies": obcTechnologyGrade1,
    "English": englishGrade1CBC,
    "Zambian language": zambianLangGrade1OBC,
    "Mathematics": mathOBCGrade1,
    "literacy in English": englishGrade1Literacy,
    "Oral English": englishGrade1Oral
  },
  "Grade 2 (OBC)": {
    "Integrated science": integratedScienceGrade2,
    "Creative and Technology Studies": obcTechnologyGrade2,
    "English": englishGrade2CBC,
    "Zambian language": zambianLangGrade2OBC,
    "Mathematics": mathOBCGrade1,
    "literacy in English": englishGrade2Literacy,
    "Oral English": englishGrade2Oral
  },
  "Grade 3 (OBC)": { 
    "Integrated science": integratedScienceGrade3,
    "Creative and Technology Studies": obcTechnologyGrade3,
    "English": englishGrade3OBC,
    "Zambian language": zambianLangGrade3OBC,
    "Mathematics": [
      {
        "title": "3.1 SETS",
        "subtopics": [
          {
            "title": "3.1.1 Describe a set by listing its members",
            "competencies": [
              "Specific Competency: 3.1.1 Describe a set by listing its members | Expected Standard: Sets and notation, Listing members of a set | [Skills]: Communication of set notation through symbolization | Values: Awareness of set notation or symbolization",
              "Specific Competency: 3.1.2 Recognise and use the symbols “=” equal to, “≠” not equal to | Expected Standard: Set symbols “=” equal to, “≠” not equal to. Also recognise on “∈” member of, “∉” not a member of, “⊂” subsets, Applying sets in real life situations | [Skills]: Application of the concept of sets to real life | Values: Teamwork through cooperative learning"
            ]
          }
        ]
      },
      {
        "title": "3.2 NUMBERS AND NOTATION",
        "subtopics": [
          {
            "title": "3.2.1 Read and write numbers up to 100 000",
            "competencies": [
              "Specific Competency: 3.2.1 Read and write numbers up to 100 000 | Expected Standard: Reading and writing numbers up to 100 000, by regrouping, Learners to the number structures 1, 10, 100, 1 000, 10 000, 100 000 | [Skills]: Communication of place value | Values: Accuracy in reading and writing",
              "Specific Competency: 3.2.2 Express a number in expanded notation | Expected Standard: Expressing numbers in expanded notation | [Skills]: Presentation of numbers in expanded notation | Values: Application of notation to real life"
            ]
          }
        ]
      },
      {
        "title": "3.3 ADDITION",
        "subtopics": [
          {
             "title": "3.3.1 Add whole numbers with sums up to 100 000",
             "competencies": [
                "Specific Competency: 3.3.1 Add whole numbers with sums up to 100 000 | Expected Standard: Addition of whole numbers with sums up to 100 000 without regrouping (Expanded notation), Addition of whole numbers by using number lines, number wheels and magic squares | [Skills]: Addition of up to five-digit numbers using the concept of 10, 100, 1000 and 10000 as a unit | Values: Awareness of the role of place values in addition, Accuracy in computations",
                "Specific Competency: 3.3.2 Carry out addition of numbers in real life situations | Expected Standard: Applying addition of numbers in real life situations (e.g. money, number of items, Length) | [Skills]: Application of addition to real life"
             ]
          }
        ]
      },
      {
        "title": "3.4 SUBTRACTION",
        "subtopics": [
          {
             "title": "3.4.1 Subtract whole numbers up to 100 000",
             "competencies": [
                "Specific Competency: 3.4.1 Subtract whole numbers up to 100 000 | Expected Standard: Subtraction of whole numbers up to 100 000 by regrouping (Vertical subtraction, expanded notation, lateral subtraction), Subtraction of whole numbers using number lines, number wheels and magic squares | [Skills]: Subtraction of up to five-digit numbers using the concept of 10, 100, 1000 and 10000 as a unit, Relating subtraction to addition | Values: Accuracy in computations",
                "Specific Competency: 3.4.2 Carry out subtraction and apply it to real life situations | Expected Standard: Applying subtraction and addition in real life situations (e.g. money, number of items, Length) | [Skills]: Application of subtraction and addition to money | Values: Teamwork through cooperative learning"
             ]
          }
        ]
      },
      {
        "title": "3.5 MULTIPLICATION",
        "subtopics": [
          {
             "title": "3.5.1 Multiply two and three digit numbers by a single digit number vertically",
             "competencies": [
                "Specific Competency: 3.5.1 Multiply two and three digit numbers by a single digit number vertically | Expected Standard: Multiplying two and three digit numbers by a single digit number using vertical multiplication, Relating multiplication to problems involving money | [Skills]: Multiplication of two and three digit by single digit numbers, Application of place values | Values: Appreciation of the use of multiplication in real life, Accuracy through cooperative learning",
                "Specific Competency: 3.5.2 Apply multiplication in real life situations | Expected Standard: Relating multiplication to problems involving money | [Skills]: Application of place values | Values: Appreciation of the use of multiplication in real life"
             ]
          }
        ]
      },
      {
        "title": "3.6 DIVISION",
        "subtopics": [
          {
             "title": "3.6.1 Divide two and three digit numbers by single digit numbers",
             "competencies": [
                "Specific Competency: 3.6.1 Divide two and three digit numbers by single digit numbers using Long division (with remainders) | Expected Standard: Dividing two and three digit numbers by single digit numbers WITHOUT REMAINDERS, Dividing two and three digit numbers by single digit numbers WITH REMAINDERS using Long division | [Skills]: Division of two and three digit by single digit numbers, Accuracy in computations, Identification of the role of the long division symbol | Values: Awareness of the concept of division",
                "Specific Competency: 3.6.2 Apply division skills in real life situations | Expected Standard: Applying multiplication and division in real life situations involving money | [Skills]: Application of division to real life | Values: Teamwork through cooperative learning"
             ]
          }
        ]
      },
      {
        "title": "3.7 NUMBER PATTERNS",
        "subtopics": [
          {
             "title": "3.7.1 Order numbers using mathematical symbols",
             "competencies": [
                "Specific Competency: 3.7.1 Order numbers using mathematical symbols “>”, “<” and “=” | Expected Standard: Using mathematical symbols “>” greater than, “<” less than, and “=” to order numbers | [Skills]: Analysis of numbers to arrange numbers | Values: Appreciation of number arrangement"
             ]
          }
        ]
      },
      {
        "title": "3.8 FRACTIONS",
        "subtopics": [
          {
             "title": "3.8.1 Identify and represent proper fractions",
             "competencies": [
                "Specific Competency: 3.8.1 Identify and represent proper fractions as equal parts of a whole | Expected Standard: Identifying proper fractions in equal parts of a whole (e.g. objects as much as possible), Names of parts (denominator, numerator, division line), Common fractions | [Skills]: Identification of proper fractions | Values: Appreciation of proper fractions",
                "Specific Competency: 3.8.2 Draw and shade proper fractions | Expected Standard: Drawing and shading proper fractions | [Skills]: Representation of proper fractions",
                "Specific Competency: 3.8.3 Add and subtract proper fractions with common denominators | Expected Standard: Adding and subtracting proper fractions having a common denominator | [Skills]: Addition and subtraction of proper fractions | Values: Accuracy in adding and subtracting proper fractions",
                "Specific Competency: 3.8.4 Apply proper fractions in real life situations | Expected Standard: Fractions in real life situations (e.g. liquids, paper folding) | [Skills]: Application of equal parts of a whole in real life"
             ]
          }
        ]
      },
      {
        "title": "3.9 MEASURES",
        "subtopics": [
          {
             "title": "3.9.1 Time, Calendar, Length, Mass, Capacity",
             "competencies": [
                "Specific Competency: 3.9.1 Tell time to a specified interval | Expected Standard: Telling time to half, quarter of an hour using the analogue clock, Intervals during the 24 hour clock | [Skills]: Telling time at specified intervals | Values: Accuracy in telling time",
                "Specific Competency: 3.9.2 Read and use the calendar | Expected Standard: Calendar | [Skills]: Reading and use of the calendar",
                "Specific Competency: 3.9.3 Describe the unit for measuring long distances | Expected Standard: Standard unit for measuring long distances (Km) | [Skills]: Describing the standard unit for measuring distance | Values: Appreciation of the use of units in measures",
                "Specific Competency: 3.9.4 Describe mass and the standard units for its measure | Expected Standard: Standard units for mass (grammes, Kilograms) | [Skills]: Describing the standard unit for measuring mass",
                "Specific Competency: 3.9.5 Describe capacity and the standard units for its measure | Expected Standard: Standard units for measuring capacity (millilitres, litres) | [Skills]: Describing the standard unit for measuring capacity"
             ]
          }
        ]
      },
      {
        "title": "3.10 STATISTICS",
        "subtopics": [
          {
             "title": "3.10.1 Collect and present ungrouped data",
             "competencies": [
                "Specific Competency: 3.10.1 Collect and present ungrouped data on a frequency table | Expected Standard: Data collection methods, Data presentation (frequency table) involving one of tally marks | [Skills]: Presentation of ungrouped data on a frequency table, Interpretation of frequency tables | Values: Interest in collecting data, Accuracy in presenting data on a frequency table"
             ]
          }
        ]
      },
      {
        "title": "3.11 RELATIONS & MAPPINGS",
        "subtopics": [
          {
             "title": "3.11.1 Draw Arrow diagrams to illustrate one-to-one mappings",
             "competencies": [
                "Specific Competency: 3.11.1 Draw Arrow diagrams to illustrate one-to-one mappings | Expected Standard: Relations and mappings involving “Times 2 plus 1 etc.” on single digit whole numbers not exceed 100 000, Use of Arrow diagrams and mapping in real life situations | [Skills]: Drawing of one-to-one mapping using arrow diagrams, Interpretation of one-to-one mapping | Values: Creativity of drawing arrow diagrams, Awareness of mapping"
             ]
          }
        ]
      },
      {
        "title": "3.12 PLANE SHAPES",
        "subtopics": [
          {
             "title": "3.12 Plane Shapes",
             "competencies": [
                "Specific Competency: 3.12.1 Identify right angled triangle by folding rectangular and squared paper | Expected Standard: Identifying right angled triangle by folding rectangular and squared paper | [Skills]: Identifying right angled triangle | Values: Curiosity in making right angled triangles using squared paper",
                "Specific Competency: 3.12.2 Draw right angled triangle on squared paper | Expected Standard: Drawing right angled triangle on squared paper | [Skills]: Drawing right angled triangle using squared paper"
             ]
          }
        ]
      }
    ],
    "Social studies": obcSocialStudiesGrade3
  },
  "Grade 4 (OBC)": {
    "English": englishGrade4OBC,
    "Integrated science": scienceGrade4OBC,
    "Social studies": obcSocialStudiesGrade4,
    "Zambian language": zambianLangGrade4OBC,
    "Mathematics": mathOBCGrade4,
    "Technology Studies": obcTechnologyGrade4,
    "Home Economics and Hospitality": homeEconomicsHospitalityGrade4,
    "Expressive Arts": expressiveArtsGrade4
  },

  "Grade 5 (OBC)": { 
    "Integrated science": integratedScienceGrade5, 
    "Technology Studies": obcTechnologyGrade5, 
    "English": englishGrade5OBC, 
    "Zambian language": zambianLangGrade5OBC,
    "Home Economics": homeEconomicsGrade5,
    "Home Economics and Hospitality": homeEconomicsHospitalityGrade5,
    "Expressive Arts": expressiveArtsGrade5,
    "Mathematics": mathOBCGrade5,
    "Social studies": obcSocialStudiesGrade5
  },
  "Grade 6 (OBC)": { 
    "Integrated science": integratedScienceGrade6, 
    "Technology Studies": obcTechnologyGrade6, 
    "English": englishGrade6OBC, 
    "Zambian language": zambianLangGrade6OBC,
    "Home Economics": homeEconomicsGrade6,
    "Home Economics and Hospitality": homeEconomicsHospitalityGrade6,
    "Expressive Arts": expressiveArtsGrade6,
    "Mathematics": mathOBCGrade6,
    "Social studies": obcSocialStudiesGrade6
  },
  "Grade 7 (OBC)": { 
    "Integrated science": integratedScienceGrade7, 
    "Technology Studies": obcTechnologyGrade7, 
    "English": englishGrade7OBC, 
    "Zambian language": zambianLangGrade7OBC,
    "Home Economics": homeEconomicsGrade7,
    "Expressive Arts": expressiveArtsGrade7,
    "Mathematics": mathOBCGrade7,
    "Social studies": obcSocialStudiesGrade7
  },
  "Grade 10 (OBC)": {
    "Home Economics": obcHomeEconomicsGrade10,
    "Civic Education": obcCivicEducationGrade10,
    "Computer Studies": obcComputerStudiesGrade10,
    "Additional Mathematics": obcAdditionalMathGrade10,
    "Biology": obcBiologyGrade10,
    "Religious Education 2044": obcRE2044Grade10,
    "English": obcEnglishGrade10,
    "Zambian language": obcZambianLanguagesGrade10,
    "Chemistry": obcChemistryGrade10,
    "Physics": obcPhysicsGrade10
  },
  "Grade 11 (OBC)": {
    "Home Economics": obcHomeEconomicsGrade11,
    "Civic Education": obcCivicEducationGrade11,
    "Computer Studies": obcComputerStudiesGrade11,
    "Additional Mathematics": obcAdditionalMathGrade11,
    "Biology": obcBiologyGrade11,
    "Religious Education 2044": obcRE2044Grade11,
    "English": obcEnglishGrade11,
    "Zambian language": obcZambianLanguagesGrade11,
    "Chemistry": obcChemistryGrade11,
    "Physics": obcPhysicsGrade11
  },
  "Grade 12 (OBC)": {
    "Home Economics": obcHomeEconomicsGrade12,
    "Civic Education": obcCivicEducationGrade12,
    "Computer Studies": obcComputerStudiesGrade12,
    "Additional Mathematics": obcAdditionalMathGrade12,
    "Biology": obcBiologyGrade12,
    "Religious Education 2044": obcRE2044Grade12,
    "English": obcEnglishGrade12,
    "Zambian language": obcZambianLanguagesGrade12,
    "Chemistry": obcChemistryGrade12,
    "Physics": obcPhysicsGrade12
  },
  "Form 5-6 A Level": {
    "Agricultural Science adva": [...advancedAgriculturalScienceForm5, ...advancedAgriculturalScienceForm6],
    "Art and Design adva": [...advancedArtDesignForm5, ...advancedArtDesignForm6],
    "Biology adva": [...advancedBiologyForm5, ...advancedBiologyForm6],
    "Business Studies adva": [...advancedBusinessStudiesForm5, ...advancedBusinessStudiesForm6],
    "Chemistry adva": [...advancedChemistryForm5, ...advancedChemistryForm6],
    "Civic Education adva": [...advancedCivicEducationForm5, ...advancedCivicEducationForm6],
    "Computer Science adva": [...advancedComputerScienceForm5, ...advancedComputerScienceForm6],
    "Design and Technology adva": [...advancedDesignTechnologyForm5, ...advancedDesignTechnologyForm6],
    "Economics adva": [...advancedEconomicsForm5, ...advancedEconomicsForm6],
    "English Language adva": [...advancedEnglishLanguageForm5, ...advancedEnglishLanguageForm6],
    "French Language adva": [...advancedFrenchForm5, ...advancedFrenchForm6],
    "Geography adva": [...advancedGeographyForm5, ...advancedGeographyForm6],
    "History adva": [...advancedHistoryForm5, ...advancedHistoryForm6],
    "Hospitality Management adva": [...advancedHospitalityForm5, ...advancedHospitalityForm6],
    "Literature in English adva": [...advancedLiteratureEnglishForm5, ...advancedLiteratureEnglishForm6],
    "Literature in Zambian Languages adva": [...advancedLiteratureZambianForm5, ...advancedLiteratureZambianForm6],
    "Mathematics adva": [...advancedMathematicsForm5, ...advancedMathematicsForm6],
    "Musical Arts Education adva": [...advancedMusicalArtsForm5, ...advancedMusicalArtsForm6],
    "Nutrition and Food Technology adva": [...advancedNutritionFoodTechForm5, ...advancedNutritionFoodTechForm6],
    "Physical Education adva": [...advancedPhysicalEducationForm5, ...advancedPhysicalEducationForm6],
    "Physics adva": [...advancedPhysicsForm5, ...advancedPhysicsForm6],
    "Religious Education adva": [...advancedReligiousEducationForm5, ...advancedReligiousEducationForm6],
    "Textile Design and Technology adva": [...advancedTextileDesignForm5, ...advancedTextileDesignForm6],
    "Travel and Tourism adva": [...advancedTravelTourismForm5, ...advancedTravelTourismForm6]
  },
  "Form 5 A Level": {
    "Agricultural Science adva": advancedAgriculturalScienceForm5,
    "Art and Design adva": advancedArtDesignForm5,
    "Biology adva": advancedBiologyForm5,
    "Business Studies adva": advancedBusinessStudiesForm5,
    "Chemistry adva": advancedChemistryForm5,
    "Civic Education adva": advancedCivicEducationForm5,
    "Computer Science adva": advancedComputerScienceForm5,
    "Design and Technology adva": advancedDesignTechnologyForm5,
    "Economics adva": advancedEconomicsForm5,
    "English Language adva": advancedEnglishLanguageForm5,
    "French Language adva": advancedFrenchForm5,
    "Geography adva": advancedGeographyForm5,
    "History adva": advancedHistoryForm5,
    "Hospitality Management adva": advancedHospitalityForm5,
    "Literature in English adva": advancedLiteratureEnglishForm5,
    "Literature in Zambian Languages adva": advancedLiteratureZambianForm5,
    "Mathematics adva": advancedMathematicsForm5,
    "Musical Arts Education adva": advancedMusicalArtsForm5,
    "Nutrition and Food Technology adva": advancedNutritionFoodTechForm5,
    "Physical Education adva": advancedPhysicalEducationForm5,
    "Physics adva": advancedPhysicsForm5,
    "Religious Education adva": advancedReligiousEducationForm5,
    "Textile Design and Technology adva": advancedTextileDesignForm5,
    "Travel and Tourism adva": advancedTravelTourismForm5
  },
  "Form 6 A Level": {
    "Agricultural Science adva": advancedAgriculturalScienceForm6,
    "Art and Design adva": advancedArtDesignForm6,
    "Biology adva": advancedBiologyForm6,
    "Business Studies adva": advancedBusinessStudiesForm6,
    "Chemistry adva": advancedChemistryForm6,
    "Civic Education adva": advancedCivicEducationForm6,
    "Computer Science adva": advancedComputerScienceForm6,
    "Design and Technology adva": advancedDesignTechnologyForm6,
    "Economics adva": advancedEconomicsForm6,
    "English Language adva": advancedEnglishLanguageForm6,
    "French Language adva": advancedFrenchForm6,
    "Geography adva": advancedGeographyForm6,
    "History adva": advancedHistoryForm6,
    "Hospitality Management adva": advancedHospitalityForm6,
    "Literature in English adva": advancedLiteratureEnglishForm6,
    "Literature in Zambian Languages adva": advancedLiteratureZambianForm6,
    "Mathematics adva": advancedMathematicsForm6,
    "Musical Arts Education adva": advancedMusicalArtsForm6,
    "Nutrition and Food Technology adva": advancedNutritionFoodTechForm6,
    "Physical Education adva": advancedPhysicalEducationForm6,
    "Physics adva": advancedPhysicsForm6,
    "Religious Education adva": advancedReligiousEducationForm6,
    "Textile Design and Technology adva": advancedTextileDesignForm6,
    "Travel and Tourism adva": advancedTravelTourismForm6
  },
  "Grade 1 (Primary)": {
    "English": [
      {
        title: "1.1 CONVERSATION",
        subtopics: [
          { title: "1.1.1 Greetings", competencies: ["1.1.1.1 Use appropriate greetings at different times of the day"] },
          { title: "1.1.2 Family", competencies: ["1.1.2.1 Use appropriate language to talk about members of a nuclear family"] },
          { title: "1.1.3 Simple Commands", competencies: ["1.1.3.1 Give and follow simple commands"] },
          { title: "1.1.4 Classroom Rules", competencies: ["1.1.4.1 Use appropriate language to talk about classroom rules"] },
          { title: "1.1.5 Home Chores and Responsibilities", competencies: ["1.1.5.1 Use appropriate language to discuss chores and responsibilities of family members"] },
          { title: "1.1.6 Time", competencies: ["1.1.6.1 Use appropriate language to tell time of the day, days of the week and months of the year"] },
          { title: "1.1.7 Food and Meals", competencies: ["1.1.7.1 Use appropriate language to talk about different foods and meals of the day"] },
          { title: "1.1.8 Occupations", competencies: ["1.1.8.1 Use appropriate language to talk about occupations in the community"] },
          { title: "1.1.9 Things Found at Home", competencies: ["1.1.9.1 Use appropriate language to talk about things found at home"] },
          { title: "1.1.10 Things Found at School", competencies: ["1.1.10.1 Use appropriate language to talk about things found at school"] },
          { title: "1.1.11 Domestic Animals", competencies: ["1.1.11.1 Use appropriate language to describe domestic animals"] },
          { title: "1.1.12 At the Market", competencies: ["1.1.12.1 Use appropriate language for buying and selling"] },
          { title: "1.1.13 Community Practices", competencies: ["1.1.13.1 Use appropriate language to talk about community practices"] },
          { title: "1.1.14 Statements", competencies: ["1.1.14.1 Use appropriate language to deny, confirm, correct and express statements and propositions"] },
          { title: "1.1.15 Plurals", competencies: ["1.1.15.1 Use the plural forms of regular nouns"] },
        ]
      },
      {
        title: "1.2 ETIQUETTE",
        subtopics: [
          { title: "1.2.1 Manners", competencies: ["1.2.1.1 Use appropriate language to talk about good manners and behaviour"] }
        ]
      },
      {
        title: "1.3 STORIES",
        subtopics: [
          { title: "1.3.1 Simple Stories", competencies: ["1.3.1.1 Analyse simple stories orally"] }
        ]
      },
      {
        title: "1.4 SONGS",
        subtopics: [
          { title: "1.4.1 Simple Songs", competencies: ["1.4.1.1 Use appropriate language in simple songs"] }
        ]
      },
      {
        title: "1.5 DRAMA",
        subtopics: [
          { title: "1.5.1 Role Playing", competencies: ["1.5.1.1 Use appropriate language to depict real-life situations"] }
        ]
      },
      {
        title: "1.6 POETRY",
        subtopics: [
          { title: "1.6.1 Simple Poems", competencies: ["1.6.1.1 Recite simple poems"] },
          { title: "1.6.2 Tongue Twisters", competencies: ["1.6.2.1 Recite tongue twisters"] }
        ]
      },
      {
        title: "1.7 DESCRIPTIONS",
        subtopics: [
          { title: "1.7.1 Describing People and Objects", competencies: ["1.7.1.1 Use appropriate language in describing people and objects"] }
        ]
      },
      {
        title: "1.8 GAMES",
        subtopics: [
          { title: "1.8.1 Language Games", competencies: ["1.8.1.1 Use appropriate language to play games"] }
        ]
      },
      {
        title: "1.9 SOUNDS",
        subtopics: [
          { title: "1.9.1 Short Vowels", competencies: ["1.9.1.1 Sound out short vowels"] },
          { title: "1.9.2 Consonants", competencies: ["1.9.2.1 Sound out consonants in English", "1.9.2.2 Blend and read words with consonants"] },
          { title: "1.9.3 Long Vowels", competencies: ["1.9.3.1 Sound out long vowels", "1.9.3.2 Blend and read words with long vowels"] },
          { title: "1.9.4 Digraphs", competencies: ["1.9.4.1 Sound out digraphs", "1.9.4.2 Blend and read words with digraphs"] },
          { title: "1.9.5 Diphthongs", competencies: ["1.9.5.1 Sound out diphthongs", "1.9.5.2 Blend and read words with diphthongs"] },
          { title: "1.9.6 Consonant Blends", competencies: ["1.9.6.1 Read words with consonant blends and clusters"] }
        ]
      },
      {
        title: "1.10 SENTENCES",
        subtopics: [
          { title: "1.10.1 Sight Words", competencies: ["1.10.1.1 Read sight words with fluency"] }
        ]
      },
      {
        title: "1.11 HANDWRITING (Manuscript/Print)",
        subtopics: [
          { title: "1.11.1 Sitting Posture", competencies: ["1.11.1.1 Demonstrate correct sitting posture"] },
          { title: "1.11.2 Fine Motor Skills", competencies: ["1.11.2.1 Use appropriate grip to hold pencils"] },
          { title: "1.11.3 Concept of Print", competencies: ["1.11.3.1 Demonstrate knowledge of basic concepts of print"] },
          { title: "1.11.4 Copying Patterns", competencies: ["1.11.4.1 Draw a variety of patterns"] },
          { title: "1.11.5 Letters of the Alphabet", competencies: ["1.11.5.1 Form upper-case and lower-case letters in print"] },
          { title: "1.11.6 Own Name", competencies: ["1.11.6.1 Write own name"] }
        ]
      },
      {
        title: "1.12 PUNCTUATION",
        subtopics: [
          { title: "1.12.1 Punctuate Sentences", competencies: ["1.12.1.1 Use correct punctuation marks in sentences"] }
        ]
      },
      {
        title: "1.13 WORD BUILDING",
        subtopics: [
          { title: "1.13.1 Decodable Words", competencies: ["1.13.1.1 Use knowledge of sounds to build words"] }
        ]
      },
      {
        title: "1.14 DICTATION",
        subtopics: [
          { title: "1.14.1 Decodable Texts", competencies: ["1.14.1.1 Write dictated words, phrases and sentences"] }
        ]
      },
      {
        title: "1.15 SEQUENCING",
        subtopics: [
          { title: "1.15.1 Word Sequencing", competencies: ["1.15.1.1 Re-arrange words within a phrase in logical order", "1.15.1.2 Re-arrange words within a sentence in logical order"] }
        ]
      }
    ],
    "Zambian Languages": [
      {
        title: "1.1 STORIES",
        subtopics: [
          { title: "1.1.1 Listening to Stories", competencies: ["1.1.1.1 Listen to stories"] },
          { title: "1.1.2 Story Telling", competencies: ["1.1.2.1 Tell stories creatively"] }
        ]
      },
      {
        title: "1.2 CONVERSATIONS",
        subtopics: [
          { title: "1.2.1 Information and Explanations", competencies: ["1.2.1.1 Use complete sentences to communicate information", "1.2.1.2 Ask relevant questions to get better understanding and knowledge"] },
          { title: "1.2.2 Discussions", competencies: ["1.2.2.1 Use appropriate language when talking to adults and friends", "1.2.2.2 Participate in discussions using complete sentences"] },
          { title: "1.2.3 Greetings", competencies: ["1.2.3.1 Use appropriate greetings"] },
          { title: "1.2.4 Debate", competencies: ["1.2.4.1 Participate in simple debates"] },
          { title: "1.2.5 Opinions", competencies: ["1.2.5.1 Express opinion using appropriate language"] },
          { title: "1.2.6 Dialogues", competencies: ["1.2.6.1 Participate in simple dialogues"] }
        ]
      },
      {
        title: "1.3 DESCRIPTIONS",
        subtopics: [
          { title: "1.3.1 People", competencies: ["1.3.1.1 Give physical descriptions of people"] },
          { title: "1.3.2 Places", competencies: ["1.3.2.1 Give descriptions of places"] },
          { title: "1.3.3 Objects", competencies: ["1.3.3.1 Give descriptions of objects"] }
        ]
      },
      {
        title: "1.4 DRAMA",
        subtopics: [
          { title: "1.4.1 Role-Play", competencies: ["1.4.1.1 Participate in role-play using appropriate vocabulary"] }
        ]
      },
      {
        title: "1.5 RIDDLES AND TONGUE TWISTERS",
        subtopics: [
          { title: "1.5.1 Riddles", competencies: ["1.5.1.1 Say and respond to riddles"] },
          { title: "1.5.2 Tongue Twisters", competencies: ["1.5.2.1 Recite tongue twisters"] }
        ]
      },
      {
        title: "1.6 PRINT CONCEPTS",
        subtopics: [
          { title: "1.6.1 Book Handling", competencies: ["1.6.1.1 Handle books"] },
          { title: "1.6.2 Print Identification", competencies: ["1.6.2.1 Discriminate print", "1.6.2.2 Interpret pictures"] }
        ]
      },
      {
        title: "1.7 PHONOLOGICAL AWARENESS",
        subtopics: [
          { title: "1.7.1 Phonemic Awareness", competencies: ["1.7.1.1 Identify and manipulate phonemes"] },
          { title: "1.7.2 Syllables", competencies: ["1.7.2.1 Identify and manipulate syllables"] },
          { title: "1.7.3 Word Awareness", competencies: ["1.7.3.1 Identify words in spoken sentences"] }
        ]
      },
      {
        title: "1.8 PHONICS",
        subtopics: [
          { title: "1.8.1 Letter Sounds", competencies: ["1.8.1.1 Sound out letters"] },
          { title: "1.8.2 Syllables", competencies: ["1.8.2.1 Blend consonants and vowels to form syllables"] },
          { title: "1.8.3 Words", competencies: ["1.8.3.1 Blend syllables to form words"] }
        ]
      },
      {
        title: "1.9 READING FLUENCY",
        subtopics: [
          { title: "1.9.1 Oral Reading", competencies: ["1.9.1.1 Read syllables aloud", "1.9.1.2 Read words aloud with correct pronunciation", "1.9.1.3 Read texts aloud with correct pronunciation and expression"] }
        ]
      },
      {
        title: "1.10 WORDS",
        subtopics: [
          { title: "1.10.1 Word Recognition", competencies: ["1.10.1.1 Recognise simple words"] }
        ]
      },
      {
        title: "1.11 NOUNS",
        subtopics: [
          { title: "1.11.1 Proper and Common Nouns", competencies: ["1.11.1.1 Identify proper and common nouns"] },
          { title: "1.11.2 Singular and Plural Nouns", competencies: ["1.11.2.1 Form plural and singular nouns"] }
        ]
      },
      {
        title: "1.12 LISTENING COMPREHENSION",
        subtopics: [
          { title: "1.12.1 Simple Inferences", competencies: ["1.12.1.1 Draw simple inferences from the information they have heard"] },
          { title: "1.12.2 Main Idea", competencies: ["1.12.2.1 Identify and express the main idea of the information they have listened to"] },
          { title: "1.12.3 Fact and Opinion", competencies: ["1.12.3.1 Differentiate fact from opinion"] },
          { title: "1.12.4 Life Experiences", competencies: ["1.12.4.1 Link their own life experiences to what they listen to"] },
          { title: "1.12.5 Word Meaning", competencies: ["1.12.5.1 Deduce meaning of unfamiliar grade level words"] }
        ]
      },
      {
        title: "1.13 READING COMPREHENSION",
        subtopics: [
          { title: "1.13.1 Story Facts", competencies: ["1.13.1.1 Provide explicitly stated information in a given text"] },
          { title: "1.13.2 Simple Inferences", competencies: ["1.13.2.1 Make simple inferences of what they read"] },
          { title: "1.13.3 Predictions", competencies: ["1.13.3.1 Make predictions based on given information"] }
        ]
      },
      {
        title: "1.14 PRE-WRITING",
        subtopics: [
          { title: "1.14.1 Sitting Posture", competencies: ["1.14.1.1 Demonstrate correct posture when writing"] },
          { title: "1.14.2 Writing Tools", competencies: ["1.14.2.1 Handle writing tools"] },
          { title: "1.14.3 Drawing", competencies: ["1.14.3.1 Draw different objects"] }
        ]
      },
      {
        title: "1.15 HANDWRITING",
        subtopics: [
          { title: "1.15.1 Letter Formation", competencies: ["1.15.1.1 Write letters"] },
          { title: "1.15.2 Manuscript Handwriting", competencies: ["1.15.2.1 Write words legibly in manuscript form"] },
          { title: "1.15.3 Word Spacing", competencies: ["1.15.3.1 Spacing words"] }
        ]
      },
      {
        title: "1.16 COMPOSITION",
        subtopics: [
          { title: "1.16.1 Drawing", competencies: ["1.16.1.1 Communicate ideas through drawing"] },
          { title: "1.16.2 Punctuation Marks", competencies: ["1.16.2.1 Use the main punctuation marks (capital letters and full stop)"] },
          { title: "1.16.3 Sentences", competencies: ["1.16.3.1 Write a complete sentence"] },
          { title: "1.16.4 Simple Story", competencies: ["1.16.4.1 Write a simple story of 2 to 3 sentences"] }
        ]
      }
    ],
    "Mathematics and science": integratedScienceGrade1,
    "Creative and Technology Studies": [
      {
        title: "1.1 SAFETY",
        subtopics: [
          { title: "1.1.1 Safety in the Immediate Environment", competencies: ["1.1.1.1 Apply safety in the immediate environment"] },
          { title: "1.1.2 Body Posture", competencies: ["1.1.2.1 Demonstrate correct postural habits"] }
        ]
      },
      {
        title: "1.2 DRAWING AND COLOURING",
        subtopics: [
          { title: "1.2.1 Free Hand Sketching", competencies: ["1.2.1.1 Sketch simple objects"] },
          { title: "1.2.2 Free Drawing", competencies: ["1.2.2.1 Draw pictures of objects"] },
          { title: "1.2.3 Colouring", competencies: ["1.2.3.1 Draw pictures showing activities", "1.2.3.2 Paint pictures based on given themes"] }
        ]
      },
      {
        title: "1.3 TOOLS AND EQUIPMENT",
        subtopics: [
          { title: "1.3.1 Hand Tools", competencies: ["1.3.1.1 Use hand tools"] },
          { title: "1.3.2 Kitchen Utensils", competencies: ["1.3.2.1 Use kitchen utensils"] }
        ]
      },
      {
        title: "1.4 MATERIALS",
        subtopics: [
          { title: "1.4.1 Sources of Materials", competencies: ["1.4.1.1 Identify sources of materials used to make things"] },
          { title: "1.4.2 Material Conservation", competencies: ["1.4.2.1 Practise ways of conserving materials"] },
          { title: "1.4.3 Use of Materials", competencies: ["1.4.3.1 Use locally available materials to make products"] }
        ]
      },
      {
        title: "1.5 PATTERNS",
        subtopics: [
          { title: "1.5.1 Simple Patterns", competencies: ["1.5.1.1 Make simple patterns"] }
        ]
      },
      {
        title: "1.6 SOUNDS",
        subtopics: [
          { title: "1.6.1 Exploration of Sounds", competencies: ["1.6.1.1 Produce different sounds"] }
        ]
      },
      {
        title: "1.7 DRAMA",
        subtopics: [
          { title: "1.7.1 Drama", competencies: ["1.6.1.2 Practise simple plays"] }
        ]
      },
      {
        title: "1.8 HOSPITALITY",
        subtopics: [
          { title: "1.8.1 Customer Service", competencies: ["1.8.1.1 Perform customer service skills"] },
          { title: "1.8.2 Cleaning", competencies: ["1.8.2.1 Clean rooms using different items"] }
        ]
      },
      {
        title: "1.9 ICT DEVICES IN EVERYDAY LIFE",
        subtopics: [
          { title: "1.9.1 ICT Devices", competencies: ["1.9.1.1 Use ICT devices"] }
        ]
      },
      {
        title: "1.10 COMPUTER SOFTWARE",
        subtopics: [
          { title: "1.10.1 Computer Educational Games", competencies: ["1.10.1.1 Play computer educational games"] }
        ]
      },
      {
        title: "1.11 HEALTH AND FITNESS MANAGEMENT",
        subtopics: [
          { title: "1.11.1 Fitness and Health", competencies: ["1.11.1.1 Perform fitness and health activities"] },
          { title: "1.11.2 Educational Gymnastics", competencies: ["1.11.2.1 Perform tumbling activities", "1.11.2.2 Perform stunt activities"] }
        ]
      },
      {
        title: "1.12 TOURISM",
        subtopics: [
          { title: "1.12.1 Cultures and Landmarks", competencies: ["1.12.1.1 Explore different cultures in the community", "1.12.1.2 Locate landmarks using cardinal points"] }
        ]
      },
      {
        title: "1.13 SPORTS SKILLS DEVELOPMENT",
        subtopics: [
          { title: "1.13.1 Games", competencies: ["1.13.1.1 Perform games"] },
          { title: "1.13.2 Field and Track Events", competencies: ["1.13.2.1 Perform Field and Track Events"] }
        ]
      },
      {
        title: "1.14 NEEDLEWORK",
        subtopics: [
          { title: "1.14.1 Needlework Tools", competencies: ["1.14.1.1 Use small needlework tools"] }
        ]
      },
      {
        title: "1.15 GRAPHIC COMMUNICATION",
        subtopics: [
          { title: "1.15.1 Lines", competencies: ["1.15.1.1 Draw different types of lines"] }
        ]
      },
      {
        title: "1.16 CRAFTS",
        subtopics: [
          { title: "1.16.1 Paper Crafts", competencies: ["1.16.1.1 Make items using paper", "1.16.1.2 Make different pictures using collage technique"] },
          { title: "1.16.2 Modeling", competencies: ["1.16.2.1 Model objects using clay/plasticine"] }
        ]
      },
      {
        title: "1.17 LETTERING",
        subtopics: [
          { title: "1.17.1 Letters of the Alphabet", competencies: ["1.17.1.1 Design letters of the alphabet"] }
        ]
      },
      {
        title: "1.18 SWIMMING",
        subtopics: [
          { title: "1.18.1 Pool Hygiene", competencies: ["1.18.1.1 Apply rules on pool hygiene"] }
        ]
      },
      {
        title: "1.19 STRUCTURES",
        subtopics: [
          { title: "1.19.1 Types of Structures", competencies: ["1.19.1.1 Identify types of structures"] }
        ]
      },
      {
        title: "1.20 ENTREPRENEURSHIP",
        subtopics: [
          { title: "1.20.1 Entrepreneur", competencies: ["1.20.1.1 Demonstrate knowledge on the roles of an entrepreneur"] }
        ]
      }
    ]
  },
  "Grade 2 (Primary)": {
    "English": [
      {
        title: "2.1 CONVERSATION",
        subtopics: [
          { title: "2.1.1 Family", competencies: ["2.1.1.1 Use appropriate language to talk about an extended family"] },
          { title: "2.1.2 Time", competencies: ["2.1.2.1 Use appropriate language to describe seasons of the year"] },
          { title: "2.1.3 Places in the Community", competencies: ["2.1.3.1 Use appropriate language to name different places in the community"] },
          { title: "2.1.4 Community Practices", competencies: ["2.1.4.1 Use appropriate language to talk about good practices in the community"] },
          { title: "2.1.5 Instructions", competencies: ["2.1.5.1 Give and follow a series of instructions"] },
          { title: "2.1.6 Occupations", competencies: ["2.1.6.1 Use appropriate language to discuss different occupations in the community"] },
          { title: "2.1.7 Expressing Feelings", competencies: ["2.1.7.1 Use appropriate language to express feelings"] },
          { title: "2.1.8 Expressing Opinions", competencies: ["2.1.8.1 Use appropriate language to express personal opinions"] },
          { title: "2.1.9 Wild Animals", competencies: ["2.1.9.1 Use appropriate language to describe wild animals"] },
          { title: "2.1.10 Etiquette", competencies: ["2.1.10.1 Use appropriate language to demonstrate manners and good behaviour"] }
        ]
      },
      {
        title: "2.2 STORIES",
        subtopics: [
          { title: "2.2.1 Simple Stories", competencies: ["2.2.1.1 Analyse simple stories"] }
        ]
      },
      {
        title: "2.3 DRAMA",
        subtopics: [
          { title: "2.3.1 Simple Plays", competencies: ["2.3.1.1 Use language to engage in simple plays"] }
        ]
      },
      {
        title: "2.4 POETRY",
        subtopics: [
          { title: "2.4.1 Simple Poems", competencies: ["2.4.1.1 Recite simple poems"] }
        ]
      },
      {
        title: "2.5 RIDDLES",
        subtopics: [
          { title: "2.5.1 Simple Riddles", competencies: ["2.5.1.1 Interpret simple riddles"] }
        ]
      },
      {
        title: "2.6 SONGS",
        subtopics: [
          { title: "2.6.1 Simple Songs", competencies: ["2.6.1.1 Use appropriate language in singing songs"] }
        ]
      },
      {
        title: "2.7 DESCRIPTIONS",
        subtopics: [
          { title: "2.7.1 Describing People", competencies: ["2.7.1.1 Use appropriate language to describe people"] }
        ]
      },
      {
        title: "2.8 GAMES",
        subtopics: [
          { title: "2.8.1 Language Games", competencies: ["2.8.1.1 Use appropriate language in playing games"] }
        ]
      },
      {
        title: "2.9 SOUNDS",
        subtopics: [
          { title: "2.9.1 Consonant Alternative Spelling Choices", competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonants", "2.9.1.2 Blend and read words with alternative spelling choices of consonants"] },
          { title: "2.9.2 Vowel Alternative Spelling Choices", competencies: ["2.9.2.1 Identify sounds and graphemes used as alternative spelling choices of vowels", "2.9.2.2 Blend and read words with alternative spelling choices of vowels"] },
          { title: "2.9.3 Digraph Alternative Spelling Choices", competencies: ["2.9.3.1 Identify alternative spelling choices of digraphs", "2.9.3.2 Use alternative spelling choices of digraphs to blend and read words"] },
          { title: "2.9.4 Trigraphs", competencies: ["2.9.4.1 Sound out trigraphs in words", "2.9.4.2 Blend and read words using trigraphs"] },
          { title: "2.9.5 Consonant Blends", competencies: ["2.9.5.1 Sound initial and final consonant blends"] }
        ]
      },
      {
        title: "2.10 SENTENCES",
        subtopics: [
          { title: "2.10.1 Sight Words", competencies: ["2.10.1.1 Read sight words with fluency"] }
        ]
      },
      {
        title: "2.11 COMPREHENSION",
        subtopics: [
          { title: "2.11.1 Intensive Reading", competencies: ["2.11.1.1 Read texts with understanding"] },
          { title: "2.11.2 Extensive Reading", competencies: ["2.11.2.1 Read a variety of texts for pleasure"] }
        ]
      },
      {
        title: "2.12 HANDWRITING (Tailed Writing)",
        subtopics: [
          { title: "2.12.1 Copying", competencies: ["2.12.1.1 Write lower and upper-case letters using tailed handwriting", "2.12.1.2 Write decodable and sight words", "2.12.1.3 Write phrases", "2.12.1.4 Write sentences", "2.12.1.5 Write paragraphs"] }
        ]
      },
      {
        title: "2.13 SENTENCE CONSTRUCTION",
        subtopics: [
          { title: "2.13.1 Words, Phrases and Sentences", competencies: ["2.13.1.1 Write words, phrases and simple sentences independently"] }
        ]
      },
      {
        title: "2.14 ALPHABETICAL ORDER AND SEQUENCING",
        subtopics: [
          { title: "2.14.1 Alphabetical Order", competencies: ["2.14.1.1 Sequence words according to alphabetical order"] },
          { title: "2.14.2 Logical Order", competencies: ["2.14.2.1 Sequence words and sentences logically"] }
        ]
      },
      {
        title: "2.15 SPELLING",
        subtopics: [
          { title: "2.15.1 Word Spelling", competencies: ["2.15.1.1 Spell words correctly"] },
          { title: "2.15.2 Dictation", competencies: ["2.15.2.1 Write dictated words, phrases and sentences"] }
        ]
      },
      {
        title: "2.16 WORD RELATIONSHIPS",
        subtopics: [
          { title: "2.16.1 Synonyms", competencies: ["2.16.1.1 Demonstrate knowledge of synonyms"] },
          { title: "2.16.2 Antonyms", competencies: ["2.16.2.1 Demonstrate knowledge of antonyms"] }
        ]
      },
      {
        title: "2.17 PARTS OF SPEECH",
        subtopics: [
          { title: "2.17.1 Nouns", competencies: ["2.17.1.1 Demonstrate knowledge of nouns"] },
          { title: "2.17.2 Verbs", competencies: ["2.17.2.1 Demonstrate knowledge of verbs"] },
          { title: "2.17.3 Prepositions", competencies: ["2.17.3.1 Demonstrate knowledge of prepositions"] },
          { title: "2.17.4 Conjunctions", competencies: ["2.17.4.1 Demonstrate knowledge of conjunctions"] },
          { title: "2.17.5 Possessive Words", competencies: ["2.17.5.1 Demonstrate knowledge of possessive words"] }
        ]
      },
      {
        title: "2.18 PUNCTUATION",
        subtopics: [
          { title: "2.18.1 Punctuate Sentences", competencies: ["2.18.1.1 Use commas and question marks in sentences"] }
        ]
      }
    ],
    "Zambian Languages": [
      {
        title: "2.1 STORIES",
        subtopics: [
          { title: "2.1.1 Listening to Stories", competencies: ["2.1.1.1 Listen to grade level stories"] },
          { title: "2.1.2 Story Telling", competencies: ["2.1.2.1 Retell stories creatively", "2.1.2.2 Tell stories creatively"] }
        ]
      },
      {
        title: "2.2 CONVERSATIONS",
        subtopics: [
          { title: "2.2.1 Information and Explanations", competencies: ["2.2.1.1 Use complete sentences to communicate information", "2.2.1.2 Ask relevant questions to get better understanding and knowledge"] },
          { title: "2.2.2 Discussion", competencies: ["2.2.2.1 Take part in discussions"] },
          { title: "2.2.3 Debate", competencies: ["2.2.3.1 Participate in simple debates"] }
        ]
      },
      {
        title: "2.3 DESCRIPTIONS",
        subtopics: [
          { title: "2.3.1 People", competencies: ["2.3.1.1 Give physical descriptions of people"] },
          { title: "2.3.2 Places", competencies: ["2.3.2.1 Give descriptions of places"] },
          { title: "2.3.3 Objects", competencies: ["2.3.3.1 Give descriptions of objects"] }
        ]
      },
      {
        title: "2.4 DRAMA",
        subtopics: [
          { title: "2.4.1 Role Play", competencies: ["2.4.1.1 Participate in role-play"] }
        ]
      },
      {
        title: "2.5 RIDDLES AND TONGUE TWISTERS",
        subtopics: [
          { title: "2.5.1 Riddles", competencies: ["2.5.1.1 Say and respond to riddles"] },
          { title: "2.5.2 Tongue Twisters", competencies: ["2.5.2.1 Recite tongue-twisters"] }
        ]
      },
      {
        title: "2.6 READING FLUENCY",
        subtopics: [
          { title: "2.6.1 Oral Reading", competencies: ["2.6.1.1 Read aloud syllables formed by three or more consonant clusters", "2.6.1.2 Read words of increasing number of syllables", "2.6.1.3 Read texts of 4-7 sentences fluently", "2.6.1.4 Read own writing fluently"] }
        ]
      },
      {
        title: "2.7 SYNONYMS AND ANTONYMS",
        subtopics: [
          { title: "2.7.1 Synonyms", competencies: ["2.7.1.1 Identify synonyms"] },
          { title: "2.7.2 Antonyms", competencies: ["2.7.2.1 Identify antonyms"] }
        ]
      },
      {
        title: "2.8 NOUNS",
        subtopics: [
          { title: "2.8.1 Singular and Plural Nouns", competencies: ["2.8.1.1 Form plural and singular nouns"] },
          { title: "2.8.2 Proper Nouns", competencies: ["2.8.2.1 Identify proper nouns"] },
          { title: "2.8.3 Common Nouns", competencies: ["2.8.3.1 Identify common nouns"] }
        ]
      },
      {
        title: "2.9 LISTENING COMPREHENSION",
        subtopics: [
          { title: "2.9.1 Making Inferences", competencies: ["2.9.1.1 Draw inferences from the information they have heard"] },
          { title: "2.9.2 Word Meaning", competencies: ["2.9.2.1 Deduce the meaning of unfamiliar grade level words"] },
          { title: "2.9.3 Main Idea", competencies: ["2.9.3.1 Express the main idea of the information they have listened to"] },
          { title: "2.9.4 Life Experiences", competencies: ["2.9.4.1 Link their own life experiences to what they listen to"] }
        ]
      },
      {
        title: "2.10 SUMMARY",
        subtopics: [
          { title: "2.10.1 Story Summary", competencies: ["2.10.1.1 Summarise grade level stories"] }
        ]
      },
      {
        title: "2.11 READING COMPREHENSION",
        subtopics: [
          { title: "2.11.1 Story Facts", competencies: ["2.11.1.1 Provide explicitly stated information in a given grade level text", "2.11.1.2 Identify the main idea in a story", "2.11.1.3 Recall order of events in a text"] },
          { title: "2.11.2 Predictions", competencies: ["2.11.2.1 Make predictions based on given information"] },
          { title: "2.11.3 Making Inferences", competencies: ["2.11.3.1 Draw inferences from written material"] },
          { title: "2.11.4 Life Experiences", competencies: ["2.11.4.1 Link their own life experiences to what they read"] }
        ]
      },
      {
        title: "2.12 HANDWRITING",
        subtopics: [
          { title: "2.12.1 Manuscript Writing", competencies: ["2.12.1.1 Write words of increasing number of syllables legibly in manuscript form", "2.12.1.2 Write sentences in manuscript form"] }
        ]
      },
      {
        title: "2.13 COMPOSITION",
        subtopics: [
          { title: "2.13.1 Drawing", competencies: ["2.13.1.1 Communicate ideas through drawing"] },
          { title: "2.13.2 Punctuation", competencies: ["2.13.2.1 Use the main punctuation marks (capital letters, full stop, comma and question mark)"] },
          { title: "2.13.3 Sentences", competencies: ["2.13.3.1 Write complete sentences"] },
          { title: "2.13.4 Fiction", competencies: ["2.13.4.1 Compose and write a short fiction story of 4 to 6 sentences"] },
          { title: "2.13.5 Non-fiction", competencies: ["2.13.5.1 Compose and write a short exposition"] }
        ]
      }
    ],
    "Mathematics and science": integratedScienceGrade2,
    "Creative and Technology Studies": [
      {
        title: "2.1 SAFETY",
        subtopics: [
          { title: "2.1.1 Accidents Prevention", competencies: ["2.1.1.1 Demonstrate ways of preventing accidents in the immediate environment"] },
          { title: "2.1.2 First Aid", competencies: ["2.1.2.1 Demonstrate skills in First Aid"] }
        ]
      },
      {
        title: "2.2 TOOLS AND EQUIPMENT",
        subtopics: [
          { title: "2.2.1 Measuring Tools", competencies: ["2.2.1.1 Use measuring tools"] },
          { title: "2.2.2 Kitchen Equipment", competencies: ["2.2.2.1 Use equipment found in the kitchen"] }
        ]
      },
      {
        title: "2.3 DRAWING AND COLOURING",
        subtopics: [
          { title: "2.3.1 Free Drawing", competencies: ["2.3.1.1 Draw pictures"] },
          { title: "2.3.2 Colouring", competencies: ["2.3.2.1 Paint pictures from still life"] }
        ]
      },
      {
        title: "2.4 MATERIALS",
        subtopics: [
          { title: "2.4.1 Making Items", competencies: ["2.4.1.1 Make items using available local materials"] }
        ]
      },
      {
        title: "2.5 PATTERNS",
        subtopics: [
          { title: "2.5.1 Types of Patterns", competencies: ["2.5.1.1 Design patterns"] }
        ]
      },
      {
        title: "2.6 HOSPITALITY",
        subtopics: [
          { title: "2.6.1 Places in Hospitality", competencies: ["2.6.1.1 Explore places in hospitality"] }
        ]
      },
      {
        title: "2.7 MATERIALS",
        subtopics: [
          { title: "2.7.1 Waste Disposal", competencies: ["2.7.1.1 Demonstrate correct ways of disposing waste"] },
          { title: "2.7.2 Making Items", competencies: ["2.7.2.1 Make items using locally available materials"] }
        ]
      },
      {
        title: "2.8 COMPUTER",
        subtopics: [
          { title: "2.8.1 Computer Hardware", competencies: ["2.8.1.1 Operate basic Computer Hardware"] },
          { title: "2.8.2 Computer Software", competencies: ["2.8.2.1 Use word document"] }
        ]
      },
      {
        title: "2.9 SOUNDS",
        subtopics: [
          { title: "2.9.1 Sounds", competencies: ["2.9.1.1 Imitate sounds from different sources"] }
        ]
      },
      {
        title: "2.10 TOURISM",
        subtopics: [
          { title: "2.10.1 Attraction Sites", competencies: ["2.10.1.1 Explore local attraction sites"] }
        ]
      },
      {
        title: "2.11 ENERGY",
        subtopics: [
          { title: "2.11.1 Heat", competencies: ["2.11.1.1 Use heat to treat materials"] },
          { title: "2.11.2 Energy Conservation", competencies: ["2.11.2.1 Identify items that conserve energy"] }
        ]
      },
      {
        title: "2.12 HEALTH AND FITNESS MANAGEMENT",
        subtopics: [
          { title: "2.12.1 Fitness", competencies: ["2.12.1.1 Perform developmental activities"] },
          { title: "2.12.2 Educational Gymnastics", competencies: ["2.12.2.1 Perform tumbling activities", "2.12.2.2 Perform stunts activities"] }
        ]
      },
      {
        title: "2.13 NEEDLEWORK",
        subtopics: [
          { title: "2.13.1 Needlework Tools", competencies: ["2.13.1.1 Use needlework tools"] }
        ]
      },
      {
        title: "2.14 RECREATION",
        subtopics: [
          { title: "2.14.1 Movement and Dance", competencies: ["2.14.1.1 Perform structured movements"] }
        ]
      },
      {
        title: "2.15 CRAFTS",
        subtopics: [
          { title: "2.15.1 Plaiting", competencies: ["2.15.1.1 Plait using locally available materials"] },
          { title: "2.15.2 Weaving", competencies: ["2.15.2.1 Make familiar objects using weaving techniques"] },
          { title: "2.15.3 Papier Mache", competencies: ["2.15.3.1 Model items using Papier mache"] },
          { title: "2.15.4 Construction", competencies: ["2.15.4.1 Construct familiar objects"] }
        ]
      },
      {
        title: "2.16 SPORTS SKILLS DEVELOPMENT",
        subtopics: [
          { title: "2.16.1 Games", competencies: ["2.16.1.1 Apply skills in conventional and traditional games"] },
          { title: "2.16.2 Field and Track Events", competencies: ["2.16.2.1 Perform Field and Track Events"] }
        ]
      },
      {
        title: "2.17 DESIGNING",
        subtopics: [
          { title: "2.17.1 Designing", competencies: ["2.17.1.1 Make designs of different objects"] }
        ]
      },
      {
        title: "2.18 LETTERING",
        subtopics: [
          { title: "2.18.1 Letters of the Alphabet", competencies: ["2.18.1.1 Design and cut letters of the alphabet"] }
        ]
      },
      {
        title: "2.19 SWIMMING",
        subtopics: [
          { title: "2.19.1 Water Orientation", competencies: ["2.19.1.1 Exhibit swimming skills"] }
        ]
      },
      {
        title: "2.20 ENTREPRENEURSHIP",
        subtopics: [
          { title: "2.20.1 Entrepreneurial Activities", competencies: ["2.20.1.1 Demonstrate entrepreneurial activities"] }
        ]
      }
    ]
  },
  "Grade 3 (Primary)": {
    "English": [
      {
        title: "3.1 CONVERSATION",
        subtopics: [
          { title: "3.1.1 Time", competencies: ["3.1.1.1 Use appropriate language to discuss seasons of the year"] },
          { title: "3.1.2 Places in the Community", competencies: ["3.1.2.1 Use appropriate language to discuss places in the community"] },
          { title: "3.1.3 Community Responsibilities", competencies: ["3.1.3.1 Use appropriate language to discuss community responsibilities"] },
          { title: "3.1.4 Directions", competencies: ["3.1.4.1 Use appropriate language in asking and giving simple directions"] },
          { title: "3.1.5 Instructions", competencies: ["3.1.5.1 Use appropriate language in giving and following simple instructions"] }
        ]
      },
      {
        title: "3.2 ETIQUETTE",
        subtopics: [
          { title: "3.2.1 Manners", competencies: ["3.2.1.1 Use appropriate language to demonstrate manners and good behaviour"] }
        ]
      },
      {
        title: "3.3 STORIES AND TEXTS",
        subtopics: [
          { title: "3.3.1 Simple Stories and Texts", competencies: ["3.3.1.1 Analyse simple stories and texts orally"] }
        ]
      },
      {
        title: "3.4 SONGS",
        subtopics: [
          { title: "3.4.1 Simple Songs", competencies: ["3.4.1.1 Analyse simple songs"] }
        ]
      },
      {
        title: "3.5 DRAMA",
        subtopics: [
          { title: "3.5.1 Simple Plays", competencies: ["3.5.1.1 Use appropriate language to participate in simple plays"] }
        ]
      },
      {
        title: "3.6 POETRY",
        subtopics: [
          { title: "3.6.1 Simple Poems", competencies: ["3.6.1.1 Recite simple poems"] }
        ]
      },
      {
        title: "3.7 RIDDLES",
        subtopics: [
          { title: "3.7.1 Riddles", competencies: ["3.7.1.1 Interpret simple riddles"] }
        ]
      },
      {
        title: "3.8 DESCRIPTIONS",
        subtopics: [
          { title: "3.8.1 Describing People and Objects", competencies: ["3.8.1.1 Use appropriate language to describe people and objects"] },
          { title: "3.8.2 Describing Events", competencies: ["3.8.2.1 Use appropriate language to describe events"] }
        ]
      },
      {
        title: "3.9 SOUNDS",
        subtopics: [
          { title: "3.9.1 Alternative Consonant Spelling Choices", competencies: ["3.9.1.1 Sound alternative spelling choices of consonants"] },
          { title: "3.9.2 Blend and Read Words Using Alternative Consonants", competencies: ["3.9.2.1 Blend and read words using alternative consonants"] },
          { title: "3.9.3 Vowels Alternative Spelling Choices", competencies: ["3.9.3.1 Sound alternative spelling choices of vowels", "3.9.3.2 Blend and read words with alternative spelling choices of vowels"] },
          { title: "3.9.4 Digraph Alternative Spelling Choices", competencies: ["3.9.4.1 Sound alternative spelling choices of digraphs", "3.9.4.2 Blend and read words with alternative spelling choices of digraphs"] },
          { title: "3.9.5 Trigraph Alternative Spelling Choices", competencies: ["3.9.5.1 Sound alternative spelling choices of trigraphs", "3.9.5.2 Blend and read words with alternative trigraph spelling choices"] },
          { title: "3.9.6 Consonant Blends", competencies: ["3.9.6.1 Read words with consonant blends"] }
        ]
      },
      {
        title: "3.10 SENTENCES",
        subtopics: [
          { title: "3.10.1 Sight Words", competencies: ["3.10.1.1 Read sight words in sentences with fluency"] }
        ]
      },
      {
        title: "3.11 READING ALOUD",
        subtopics: [
          { title: "3.11.1 Fluency and Expression", competencies: ["3.11.1.1 Read texts aloud with fluency"] }
        ]
      },
      {
        title: "3.12 SHARED READING",
        subtopics: [
          { title: "3.12.1 Simple Stories and Texts", competencies: ["3.12.1.1 Read simple stories and texts with understanding"] }
        ]
      },
      {
        title: "3.13 INDEPENDENT READING",
        subtopics: [
          { title: "3.13.1 Stories and Texts", competencies: ["3.13.1.1 Read stories and texts with understanding"] }
        ]
      },
      {
        title: "3.14 EXTENSIVE READING",
        subtopics: [
          { title: "3.14.1 Reading a Variety of Texts", competencies: ["3.14.1.1 Read a variety of stories and texts for pleasure"] }
        ]
      },
      {
        title: "3.15 INTENSIVE READING",
        subtopics: [
          { title: "3.15.1 Silent Reading", competencies: ["3.15.1.1 Read a variety of stories and texts with understanding"] }
        ]
      },
      {
        title: "3.16 HANDWRITING (Cursive)",
        subtopics: [
          { title: "3.16.1 Letters of the Alphabet", competencies: ["3.16.1.1 Write legibly letters of the alphabet using cursive handwriting"] }
        ]
      },
      {
        title: "3.17 SPELLING",
        subtopics: [
          { title: "3.17.1 Word Spelling", competencies: ["3.17.1.1 Spell words correctly"] },
          { title: "3.17.2 Dictation", competencies: ["3.17.2.1 Write dictated words, phrases and sentences"] }
        ]
      },
      {
        title: "3.18 WORD RELATIONSHIPS",
        subtopics: [
          { title: "3.18.1 Synonyms", competencies: ["3.18.1.1 Demonstrate knowledge of synonyms"] },
          { title: "3.18.2 Antonyms", competencies: ["3.18.2.1 Demonstrate knowledge of antonyms"] }
        ]
      },
      {
        title: "3.19 SENTENCES",
        subtopics: [
          { title: "3.19.1 Sentence Construction", competencies: ["3.19.1.1 Construct simple sentences"] }
        ]
      },
      {
        title: "3.20 PARTS OF SPEECH",
        subtopics: [
          { title: "3.20.1 Nouns", competencies: ["3.20.1.1 Demonstrate knowledge of nouns"] },
          { title: "3.20.2 Verbs", competencies: ["3.20.2.1 Demonstrate knowledge of verbs"] },
          { title: "3.20.3 Tenses", competencies: ["3.20.3.1 Demonstrate knowledge of tenses"] },
          { title: "3.20.4 Adjectives", competencies: ["3.20.4.1 Demonstrate knowledge of adjectives"] },
          { title: "3.20.5 Adverbs", competencies: ["3.20.5.1 Demonstrate knowledge of adverbs of manner"] },
          { title: "3.20.6 Reflexive Pronouns", competencies: ["3.20.6.1 Demonstrate knowledge of reflexive pronouns"] }
        ]
      },
      {
        title: "3.21 PUNCTUATION",
        subtopics: [
          { title: "3.21.1 Sentences and Short Paragraphs", competencies: ["3.21.1.1 Punctuate sentences and short paragraphs with exclamation marks and speech marks"] }
        ]
      },
      {
        title: "3.22 ALPHABETICAL ORDER AND SEQUENCING",
        subtopics: [
          { title: "3.22.1 Arranging Words and Sentences", competencies: ["3.22.1.1 Sequence words and sentences in a logical order"] },
          { title: "3.22.2 Using a Dictionary", competencies: ["3.22.2.1 Use a dictionary"] }
        ]
      },
      {
        title: "3.23 SUMMARY",
        subtopics: [
          { title: "3.23.1 Summarising", competencies: ["3.23.1.1 Summarise simple paragraphs"] }
        ]
      },
      {
        title: "3.24 COMPOSITION",
        subtopics: [
          { title: "3.24.1 Guided Composition", competencies: ["3.24.1.1 Write stories using given vocabulary"] }
        ]
      }
    ],
    "Zambian Languages": [
      {
        title: "3.1 STORIES",
        subtopics: [
          { title: "3.1.1 Listening to Stories", competencies: ["3.1.1.1 Listen to grade level stories"] },
          { title: "3.1.2 Storytelling", competencies: ["3.1.2.1 Retell grade level stories", "3.1.2.2 Tell grade level stories creatively"] }
        ]
      },
      {
        title: "3.2 CONVERSATIONS",
        subtopics: [
          { title: "3.2.1 Information and Explanations", competencies: ["3.2.1.1 Listen and speak to adults and friends"] },
          { title: "3.2.2 Simple Processes", competencies: ["3.2.2.1 Ask questions on simple processes"] },
          { title: "3.2.3 Discussion", competencies: ["3.2.3.1 Take part in discussions"] },
          { title: "3.2.4 Debate", competencies: ["3.2.4.1 Participate in simple debates"] }
        ]
      },
      {
        title: "3.3 DESCRIPTIONS",
        subtopics: [
          { title: "3.3.1 Animals", competencies: ["3.3.1.1 Give physical descriptions of animals"] },
          { title: "3.3.2 Events", competencies: ["3.3.2.1 Give descriptions of events that happen in the community"] }
        ]
      },
      {
        title: "3.4 DRAMA",
        subtopics: [
          { title: "3.4.1 Role Play", competencies: ["3.4.1.1 Participate in role play"] }
        ]
      },
      {
        title: "3.5 RIDDLES AND TONGUE TWISTERS",
        subtopics: [
          { title: "3.5.1 Riddles", competencies: ["3.5.1.1 Say and respond to riddles"] },
          { title: "3.5.2 Tongue Twisters", competencies: ["3.5.2.1 Recite tongue twisters"] }
        ]
      },
      {
        title: "3.6 READING FLUENCY",
        subtopics: [
          { title: "3.6.1 Oral Reading", competencies: ["3.6.1.1 Read grade level texts of more than seven sentences fluently", "3.6.1.2 Analyse simple stories"] }
        ]
      },
      {
        title: "3.7 ALPHABETICAL ORDER",
        subtopics: [
          { title: "3.7.1 Word Sequencing", competencies: ["3.7.1.1 Arrange words in alphabetical order"] }
        ]
      },
      {
        title: "3.8 SYNONYMS AND ANTONYMS",
        subtopics: [
          { title: "3.8.1 Synonyms", competencies: ["3.8.1.1 Use synonyms"] },
          { title: "3.8.2 Antonyms", competencies: ["3.8.2.1 Use antonyms"] }
        ]
      },
      {
        title: "3.9 NOUNS",
        subtopics: [
          { title: "3.9.1 Abstract Nouns", competencies: ["3.9.1.1 Identify abstract nouns"] }
        ]
      },
      {
        title: "3.10 LISTENING COMPREHENSION",
        subtopics: [
          { title: "3.10.1 Inferences", competencies: ["3.10.1.1 Draw inferences from the information they have heard"] },
          { title: "3.10.2 Main Idea", competencies: ["3.10.2.1 Express the main idea of the information (fiction and non-fiction) listened to", "3.10.2.2 Summarise information (fiction and non-fiction) using key information"] },
          { title: "3.10.3 Life Experiences", competencies: ["3.10.3.1 Compare their own life experiences to what they listen to"] },
          { title: "3.10.4 Fact and Opinion", competencies: ["3.10.4.1 Differentiate fact from opinion in given information"] }
        ]
      },
      {
        title: "3.11 READING COMPREHENSION",
        subtopics: [
          { title: "3.11.1 Story Facts", competencies: ["3.11.1.1 Provide explicitly stated information in a given grade level text", "3.11.1.2 Locate details in a text", "3.11.1.3 Identify chronological order of events in a text"] },
          { title: "3.11.2 Main Idea", competencies: ["3.11.2.1 Express the main idea of a grade level text"] },
          { title: "3.11.3 Life Experiences", competencies: ["3.11.3.1 Link their own life experiences to what they have read"] },
          { title: "3.11.4 Inferences", competencies: ["3.11.4.1 Draw inferences"] },
          { title: "3.11.5 Predictions", competencies: ["3.11.5.1 Make predictions based on given information"] },
          { title: "3.11.6 Word Meaning", competencies: ["3.11.6.1 Deduce the meaning of unfamiliar grade level words"] }
        ]
      },
      {
        title: "3.12 HANDWRITING",
        subtopics: [
          { title: "3.12.1 Manuscript Writing", competencies: ["3.12.1.1 Write legibly in manuscript form"] },
          { title: "3.12.2 Cursive Writing", competencies: ["3.12.2.1 Write letters and words legibly in cursive form"] }
        ]
      },
      {
        title: "3.13 SEQUENCE",
        subtopics: [
          { title: "3.13.1 Words", competencies: ["3.13.1.1 Sequence words to form a sentence"] }
        ]
      },
      {
        title: "3.14 COMPOSITION",
        subtopics: [
          { title: "3.14.1 Punctuation Marks", competencies: ["3.14.1.1 Use the punctuation marks (capital letters, full stop, question mark and exclamation mark)"] },
          { title: "3.14.2 Paragraph Building", competencies: ["3.14.2.1 Write a paragraph"] },
          { title: "3.14.3 Simple Letter", competencies: ["3.14.3.1 Write a simple letter to a friend on various situations"] },
          { title: "3.14.4 Fiction", competencies: ["3.14.4.1 Write a simple narrative"] },
          { title: "3.14.5 Non-fiction", competencies: ["3.14.5.1 Write a simple exposition"] }
        ]
      }
    ],
    "Mathematics and science": [
      {
        title: "3.1 EXPLORING MY WORLD",
        subtopics: [
          { title: "3.1.1 Grouping Things", competencies: ["3.1.1.1 Apply relationship between sets", "3.1.1.5 Interpret warning signs and labels on household chemicals", "3.1.1.6 Analyse data", "3.1.1.7 Classify plants and animals according to their characteristics"] },
          { title: "3.1.2 Things in the Surroundings", competencies: ["3.1.2.1 Apply the benefit of natural resources in daily life", "3.1.2.2 Analyse water cycle process", "3.1.1.3 Express whole numbers in a variety of ways", "3.1.1.4 Classify foods according to their nutrients", "3.1.1.8 Analyse components of soil", "3.1.1.9 Practise care for the surroundings"] }
        ]
      },
      {
        title: "3.2 UNDERSTANDING MY BODY",
        subtopics: [
          { title: "3.2.1 The Human Body", competencies: ["3.2.1.1 Exhibit care for the sensory organs", "3.2.1.2 Practise care for the human body", "3.2.1.3 Practise personal hygiene", "3.2.1.4 Use relations in different life context"] }
        ]
      },
      {
        title: "3.3 EXPLORING THE SKY AND SEASONS",
        subtopics: [
          { title: "3.3.1 Time, Length, Mass and Capacity", competencies: ["3.3.1.1 Use measures in everyday life"] },
          { title: "3.3.2 Weather and Climate Change", competencies: ["3.3.2.1 Demonstrate understanding of causes of climate change"] }
        ]
      },
      {
        title: "3.4 EXPLORING MATERIALS",
        subtopics: [
          { title: "3.4.1 Materials", competencies: ["3.4.1.1 Investigate characteristics of materials"] },
          { title: "3.4.2 Plane and Solid Shapes", competencies: ["3.4.2.1 Construct different types of shapes"] },
          { title: "3.4.3 Forces", competencies: ["3.4.3.1 Analyse the relationship between forces and movement of objects"] },
          { title: "3.4.4 Simple Machines", competencies: ["3.4.4.1 Make simple machines"] }
        ]
      },
      {
        title: "3.5 EXPLORING MIXTURES",
        subtopics: [
          { title: "3.5.1 Mixtures", competencies: ["3.5.1.1 Create different types of mixtures"] },
          { title: "3.5.2 Addition, Subtraction, Multiplication and Division of Things", competencies: ["3.5.2.1 Use whole numbers in addition in different situations", "3.5.2.2 Use whole numbers in subtraction in different life situations", "3.5.2.3 Use whole numbers in multiplication in different life situations", "3.5.2.4 Use whole numbers in division in different life situations", "3.5.2.5 Use fractions in life situations"] }
        ]
      }
    ],
    "Creative and Technology Studies": [
      {
        title: "3.1 SAFETY",
        subtopics: [
          { title: "3.1.1 Safety in Handling Hand Tools", competencies: ["3.1.1.1 Practise safety in handling hand tools"] },
          { title: "3.1.2 First Aid", competencies: ["3.1.2.1 Apply First Aid in different situations"] },
          { title: "3.1.3 Body Posture", competencies: ["3.1.3.1 Demonstrate postural activities"] }
        ]
      },
      {
        title: "3.2 COOKERY",
        subtopics: [
          { title: "3.2.1 Snacks", competencies: ["3.2.1.1 Make healthy snacks"] }
        ]
      },
      {
        title: "3.3 DRAWING AND COLOURING",
        subtopics: [
          { title: "3.3.1 Drawing", competencies: ["3.3.1.1 Draw pictures"] },
          { title: "3.3.2 Colouring", competencies: ["3.3.2.1 Colour pictures"] }
        ]
      },
      {
        title: "3.4 MATERIALS",
        subtopics: [
          { title: "3.4.1 Making Items", competencies: ["3.4.1.1 Make items using locally available materials"] }
        ]
      },
      {
        title: "3.5 PATTERNS",
        subtopics: [
          { title: "3.5.1 Patterns", competencies: ["3.5.1.1 Print patterns"] }
        ]
      },
      {
        title: "3.6 COMPUTER",
        subtopics: [
          { title: "3.6.1 Computer Hardware", competencies: ["3.6.1.1 Use Computer Hardware components"] },
          { title: "3.6.2 Computer Software", competencies: ["3.6.2.1 Design digital arts using creative and art software"] }
        ]
      },
      {
        title: "3.7 HOSPITALITY",
        subtopics: [
          { title: "3.7.1 Etiquette", competencies: ["3.7.1.1 Demonstrate good table manners"] },
          { title: "3.7.2 Laundry", competencies: ["3.7.2.1 Launder articles"] }
        ]
      },
      {
        title: "3.8 SOUNDS",
        subtopics: [
          { title: "3.8.1 Elements of Sound", competencies: ["3.8.1.1 Apply basic skills in singing and instrument playing"] }
        ]
      },
      {
        title: "3.9 RECREATION",
        subtopics: [
          { title: "3.9.1 Dance", competencies: ["3.9.1.1 Perform local dances and simple rhythmic activities"] },
          { title: "3.9.2 Songs", competencies: ["3.9.2.1 Compose songs on cross cutting issues"] }
        ]
      },
      {
        title: "3.10 TRAVEL",
        subtopics: [
          { title: "3.10.1 Travel Etiquette", competencies: ["3.10.1.1 Demonstrate travel etiquette"] }
        ]
      },
      {
        title: "3.11 ENERGY",
        subtopics: [
          { title: "3.11.1 Circuit", competencies: ["3.11.1.1 Make a circuit to produce light"] }
        ]
      },
      {
        title: "3.12 HEALTH AND FITNESS MANAGEMENT",
        subtopics: [
          { title: "3.12.1 Fitness", competencies: ["3.12.1.1 Perform simple isometric activities"] },
          { title: "3.12.2 Health", competencies: ["3.12.2.1 Perform developmental activities"] },
          { title: "3.12.3 Educational Gymnastics (Tumbling and Stunts)", competencies: ["3.12.3.1 Perform simple tumbling activities", "3.12.3.2 Demonstrate simple stunts activities"] }
        ]
      },
      {
        title: "3.13 NEEDLEWORK",
        subtopics: [
          { title: "3.13.1 Stitches", competencies: ["3.13.1.1 Work out samples of temporary stitches"] }
        ]
      },
      {
        title: "3.14 SPORTS SKILLS DEVELOPMENT",
        subtopics: [
          { title: "3.14.1 Modified Conventional Games", competencies: ["3.14.1.1 Perform modified conventional games"] },
          { title: "3.14.2 Field and Track Events", competencies: ["3.14.2.1 Perform field and track events"] },
          { title: "3.14.3 Traditional Games", competencies: ["3.14.3.1 Perform traditional games"] }
        ]
      },
      {
        title: "3.15 CRAFTS",
        subtopics: [
          { title: "3.15.1 Plaiting", competencies: ["3.15.1.1 Plait using different styles"] },
          { title: "3.15.2 Weaving", competencies: ["3.15.2.1 Make familiar objects using weaving techniques"] },
          { title: "3.15.3 Knotting", competencies: ["3.15.3.1 Make familiar objects"] },
          { title: "3.15.4 Modeling", competencies: ["3.15.4.1 Model familiar objects", "3.15.4.2 Decorate finished items"] },
          { title: "3.15.5 Construction", competencies: ["3.15.5.1 Construct familiar items using locally available materials"] },
          { title: "3.15.6 Types of Structures", competencies: ["3.15.6.1 Differentiate natural and artificial structures"] }
        ]
      },
      {
        title: "3.16 DESIGNING",
        subtopics: [
          { title: "3.16.1 Item Designing and Making", competencies: ["3.16.1.1 Design and make items"] }
        ]
      },
      {
        title: "3.17 LETTERING",
        subtopics: [
          { title: "3.17.1 Letters", competencies: ["3.17.1.1 Design capital and small letters"] },
          { title: "3.17.2 Poster Making", competencies: ["3.17.2.1 Design posters based on different concepts"] }
        ]
      },
      {
        title: "3.18 SWIMMING",
        subtopics: [
          { title: "3.18.1 Water Orientation", competencies: ["3.18.1.1 Demonstrate basic swimming strokes"] }
        ]
      },
      {
        title: "3.19 ENTREPRENEURSHIP",
        subtopics: [
          { title: "3.19.1 Entrepreneurial Activities", competencies: ["3.19.1.1 Practise making and selling items"] }
        ]
      }
    ]
  },
  "Grade 4 (Upper Primary)": {
    "English": englishGrade4CBC,
    "Mathematics": mathOBCGrade4,
    "Science": scienceGrade4OBC,
    "Social studies": obcSocialStudiesGrade4,
    "Home Economics & Hospitality": homeEconomicsHospitalityGrade4,
    "Zambian Languages": zambianLangGrade4Unpacked,
    "Expressive Arts": expressiveArtsGrade4,
    "Technology Studies": [
      {
        title: "4.1 INTRODUCTION TO TECHNOLOGY STUDIES",
        subtopics: [
          { title: "4.1.1 Career Prospects in Technology Studies", competencies: ["4.1.1.1 Explore career prospects in Technology Studies"] }
        ]
      },
      {
        title: "4.2 SAFETY",
        subtopics: [
          { title: "4.2.1 Personal Safety", competencies: ["4.2.1.1 Apply safety precautions in a work environment"] }
        ]
      },
      {
        title: "4.3 WORD PROCESSING",
        subtopics: [
          { title: "4.3.1 Introduction to Word Processing", competencies: ["4.3.1.1 Create a word document"] }
        ]
      },
      {
        title: "4.4 TOOLS AND EQUIPMENT",
        subtopics: [
          { title: "4.4.1 Work Bench", competencies: ["4.4.1.1 Use parts of a work bench"] },
          { title: "4.4.2 Classification and Use of Tools and Equipment", competencies: ["4.4.2.1 Use tools and equipment to make products"] }
        ]
      },
      {
        title: "4.5 MATERIALS",
        subtopics: [
          { title: "4.5.1 Joining of Materials", competencies: ["4.5.1.1 Join materials"] },
          { title: "4.5.2 Finishing Materials", competencies: ["4.5.2.1 Apply finishes to materials"] }
        ]
      },
      {
        title: "4.6 PRESENTATION",
        subtopics: [
          { title: "4.6.1 Basics of Presentations", competencies: ["4.6.1.1 Create presentations"] }
        ]
      },
      {
        title: "4.7 ENERGY",
        subtopics: [
          { title: "4.7.1 Electricity", competencies: ["4.7.1.1 Make electrical circuits"] }
        ]
      },
      {
        title: "4.8 SPREAD SHEET",
        subtopics: [
          { title: "4.8.1 Basics of Spreadsheet", competencies: ["4.8.1.1 Use spreadsheet applications"] }
        ]
      },
      {
        title: "4.9 GRAPHIC COMMUNICATION",
        subtopics: [
          { title: "4.9.1 Lettering", competencies: ["4.9.1.1 Print letters and numbers"] },
          { title: "4.9.2 Types of Lines", competencies: ["4.9.2.1 Draw lines used in construction"] },
          { title: "4.9.3 Angles", competencies: ["4.9.3.1 Construct angles"] },
          { title: "4.9.4 Triangles", competencies: ["4.9.4.1 Construct triangles from given data"] },
          { title: "4.9.5 Quadrilaterals", competencies: ["4.9.5.1 Construct quadrilaterals"] },
          { title: "4.9.6 Circles", competencies: ["4.9.6.1 Construct circles"] },
          { title: "4.9.7 Graphic Software", competencies: ["4.9.7.1 Use graphic software in product design"] }
        ]
      },
      {
        title: "4.10 TECHNOLOGY",
        subtopics: [
          { title: "4.10.1 Technological Innovations", competencies: ["4.10.1.1 Explore technological innovations"] }
        ]
      },
      {
        title: "4.11 CODING",
        subtopics: [
          { title: "4.11.1 Block-Based Coding", competencies: ["4.11.1.1 Use Block-based coding platforms"] }
        ]
      },
      {
        title: "4.12 STRUCTURES",
        subtopics: [
          { title: "4.12.1 Types of Structures", competencies: ["4.12.1.1 Classify structures"] }
        ]
      },
      {
        title: "4.13 INTERNET",
        subtopics: [
          { title: "4.13.1 Internet", competencies: ["4.13.1.1 Use the Internet"] }
        ]
      },
      {
        title: "4.14 ENTREPRENEURSHIP",
        subtopics: [
          { title: "4.14.1 Business Idea", competencies: ["4.14.1.1 Develop a business idea"] }
        ]
      },
      {
        title: "REFERENCES",
        subtopics: [
          {
            title: "General References",
            competencies: [
              "Curriculum Development Centre, (2024). Environmental Health and Pollution Management Education Framework, Ministry of Education, Lusaka: Zambia",
              "Ministry of Education, (2024) Zambia Education Curriculum Framework",
              "Ministry of Finance and National Development, (2022). Eighth National Development Plan, Republic of Zambia"
            ]
          }
        ]
      }
    ],
  },
  "Grade 5 (Upper Primary)": {
    "Home Economics & Hospitality": homeEconomicsHospitalityGrade5,
    "English": englishGrade5CBC,
    "Zambian language": zambianLangGrade5Unpacked,
    "Mathematics": [
      {
        title: "5.1 SETS",
        subtopics: [
          { title: "5.1.1 Venn Diagrams", competencies: ["5.1.1.1 Use set operations to present ideas in everyday life"] }
        ]
      },
      {
        title: "5.2 NUMBERS",
        subtopics: [
          { title: "5.2.1 Roman Numerals", competencies: ["5.2.1.1 Use the Roman numeration system to communicate ideas in life context"] },
          { title: "5.2.2 Prime and Composite Numbers", competencies: ["5.2.2.1 Apply prime and composite numbers in everyday context"] }
        ]
      },
      {
        title: "5.3 FRACTIONS",
        subtopics: [
          { title: "5.3.1 Common Fractions", competencies: ["5.3.1.1 Apply fractions in everyday life"] },
          { title: "5.3.2 Decimal Fractions", competencies: ["5.3.2.1 Utilise decimal fractions in everyday life"] }
        ]
      },
      {
        title: "5.4 COMBINED OPERATIONS",
        subtopics: [
          { title: "5.4.1 Order of Operations", competencies: ["5.4.1.1 Apply combined operations in daily situations"] }
        ]
      },
      {
        title: "5.5 ANGLES",
        subtopics: [
          { title: "5.5.1 Related Angles", competencies: ["5.5.1.1 Apply angles in different life contexts"] }
        ]
      },
      {
        title: "5.6 SHAPES",
        subtopics: [
          { title: "5.6.1 Plane Shapes (Symmetry)", competencies: ["5.6.1.1 Relate line of symmetry in life context"] },
          { title: "5.6.2 Solid Shapes", competencies: ["5.6.2.1 Create prisms in life context"] }
        ]
      },
      {
        title: "5.7 MEASURES",
        subtopics: [
          { title: "5.7.1 Perimeter, Area and Volume", competencies: ["5.7.1.1 Apply measurements in different life contexts"] }
        ]
      }
    ],
    "Science": [
      {
        title: "5.1 THE HUMAN BODY",
        subtopics: [
          { title: "5.1.1 The Skeletal System", competencies: ["5.1.1.1 Demonstrate understanding of the skeletal system of the human body"] },
          { title: "5.1.2 Puberty", competencies: ["5.1.2.1 Examine changes associated with puberty in girls and boys", "5.1.2.2 Practise personal hygiene at puberty stage", "5.1.2.3 Examine risks associated with puberty"] }
        ]
      },
      {
        title: "5.2 NUTRITION AND HEALTH",
        subtopics: [
          { title: "5.2.1 Food Nutrients", competencies: ["5.2.1.1 Classify food nutrients according to their function in the body"] },
          { title: "5.2.2 Labels on Packaged Foods", competencies: ["5.2.2.1 Interpret the labels on the packaged foods"] },
          { title: "5.2.3 Malnutrition", competencies: ["5.2.3.1 Give signs/symptoms of malnutrition in the community"] },
          { title: "5.2.4 Harmful Substances and their Effects", competencies: ["5.2.4.1 Investigate the effects of harmful substances on the health of individuals"] },
          { title: "5.2.5 Parasitic Diseases", competencies: ["5.2.5.1 Explore ways of preventing the spread of parasitic diseases in the community"] },
          { title: "5.2.6 STIs, HIV and AIDS", competencies: ["5.2.6.1 Analyse ways of preventing infection of STIs, including HIV"] }
        ]
      },
      {
        title: "5.3 THE ENVIRONMENT",
        subtopics: [
          { title: "5.3.1 Climate Change", competencies: ["5.3.1.1 Explore the causes and effects of climate change on the environment"] },
          { title: "5.3.2 The Water Cycle", competencies: ["5.3.2.1 Analyse the water cycle"] }
        ]
      },
      {
        title: "5.4 PLANTS AND ANIMALS",
        subtopics: [
          { title: "5.4.1 Soil Health", competencies: ["5.4.1.1 Explore ways of improving soil health"] },
          { title: "5.4.2 Vertebrate Animals", competencies: ["5.4.2.1 Classify vertebrate animals based on their characteristics", "5.4.2.2 Evaluate the economic importance of vertebrate animals"] },
          { title: "5.4.3 Poultry", competencies: ["5.4.3.1 Demonstrate basic understanding of poultry production"] }
        ]
      },
      {
        title: "5.5 MATERIALS AND ENERGY",
        subtopics: [
          { title: "5.5.1 Harnessing Electrical Energy", competencies: ["5.5.1.1 Explore alternative sources of electrical energy"] },
          { title: "5.5.2 Electricity", competencies: ["5.5.2.1 Construct electric circuits to demonstrate the flow of electricity", "5.5.2.2 Construct a simple Direct Current motor"] },
          { title: "5.5.3 Storage of Energy", competencies: ["5.5.3.1 Explore ways of storing energy"] },
          { title: "5.5.4 Separation Techniques", competencies: ["5.5.4.1 Separate mixtures using an appropriate technique"] },
          { title: "5.5.5 Simple Machines", competencies: ["5.5.5.1 Construct inclined planes"] },
          { title: "5.5.6 Farm Machinery", competencies: ["5.5.6.1 Use simple farm tools and implement"] }
        ]
      }
    ],
    "Social Studies": [
      {
        title: "5.1 FRIENDSHIP",
        subtopics: [
          { title: "5.1.1 Health Friendships", competencies: ["5.1.1.1 Develop healthy friendships", "5.1.1.2 Show understanding of self-awareness and self-esteem"] },
          { title: "5.1.3 Value of Friendship", competencies: ["5.1.3.1 Evaluate value of friendship"] },
          { title: "5.1.4 Ways of Showing Respect to One’s Body", competencies: ["5.1.4.1 Perform actions that show respect for one’s body"] },
          { title: "5.1.5 Individual Differences", competencies: ["5.1.5.1 Demonstrate respect for individual differences", "5.1.5.2 Manage personal emotions"] },
          { title: "5.1.6 Friendship in Different Religions", competencies: ["5.1.6.1 Develop healthy HIV relationships"] }
        ]
      },
      {
        title: "5.2 ZAMBIA",
        subtopics: [
          { title: "5.2.1 Provinces in Zambia", competencies: ["5.2.1.1 Locate provinces on the map of Zambia"] },
          { title: "5.2.2 Physical Features", competencies: ["5.2.2.1 Locate physical features on the map of Zambia"] },
          { title: "5.2.3 Cultural Features", competencies: ["5.2.3.1 Locate (man-made) cultural features"] },
          { title: "5.2.4 Economic Activities", competencies: ["5.2.4.1 Analyse economic activities in Zambia"] }
        ]
      },
      {
        title: "5.3 GOVERNANCE",
        subtopics: [
          { title: "5.3.1 Human Rights", competencies: ["5.3.1.1 Analyse respect for human rights"] },
          { title: "5.3.2 Corruption", competencies: ["5.3.2.1 Show understanding of corruption"] },
          { title: "5.3.3 Child Abuse", competencies: ["5.3.3.1 Analyse ways of preventing child abuse"] },
          { title: "5.3.4 Gender Roles", competencies: ["5.3.4.1 Perform gender roles"] }
        ]
      },
      {
        title: "5.4 LEARNING ABOUT THE PAST",
        subtopics: [
          { title: "5.4.1 The Bantu Speaking People of Zambia", competencies: ["5.4.1.1 Locate historical settlement areas of the Bantu speaking people in Zambia"] }
        ]
      },
      {
        title: "5.5 ENTREPRENEURSHIP",
        subtopics: [
          { title: "5.5.1 Business Idea", competencies: ["5.5.1.1 Generate business ideas"] },
          { title: "5.5.2 Business Plan", competencies: ["5.5.2.1 Prepare business plan"] }
        ]
      },
      {
        title: "5.6 LEARNING ABOUT MONEY",
        subtopics: [
          { title: "5.6.1 Tax", competencies: ["5.6.1.1 Show understanding of benefits pay tax"] },
          { title: "5.6.2 Zambia Revenue Authority (ZRA)", competencies: ["5.6.2.1 Demonstrate understanding of the roles of ZRA"] }
        ]
      },
      {
        title: "5.7 TRANSPORT AND COMMUNICATION",
        subtopics: [
          { title: "5.7.1 Road Safety", competencies: ["5.7.1.1 Demonstrate ways of promoting road safety"] }
        ]
      },
      {
        title: "5.8 WEATHER AND CLIMATE",
        subtopics: [
          { title: "5.8.1 Climate Change", competencies: ["5.8.1.1 Analyse effects of climate change"] }
        ]
      },
      {
        title: "5.9 THE ENVIRONMENT",
        subtopics: [
          { title: "5.9.1 Waste Management", competencies: ["5.9.1.1 Practise waste management in the immediate environment"] }
        ]
      }
    ],
    "Expressive Arts": expressiveArtsGrade5,
    "Technology Studies": [
      {
        title: "5.1 SAFETY",
        subtopics: [
          { title: "5.1.1 Care and Maintenance of Tools and Equipment", competencies: ["5.1.1.1 Maintain tools and equipment"] }
        ]
      },
      {
        title: "5.2 WORD PROCESSING",
        subtopics: [
          { title: "5.2.1 Formatting", competencies: ["5.2.1.1 Format a word document"] }
        ]
      },
      {
        title: "5.3 TOOLS AND EQUIPMENT",
        subtopics: [
          { title: "5.3.1 Hand Tools", competencies: ["5.3.1.1 Use hand tools to make products"] }
        ]
      },
      {
        title: "5.4 MATERIALS",
        subtopics: [
          { title: "5.4.1 Joining Materials", competencies: ["5.4.1.1 Join materials"] }
        ]
      },
      {
        title: "5.5 PRESENTATION",
        subtopics: [
          { title: "5.5.1 Multimedia Presentations", competencies: ["5.5.1.1 Develop multimedia presentations"] }
        ]
      },
      {
        title: "5.6 ENERGY",
        subtopics: [
          { title: "5.6.1 Design Circuits", competencies: ["5.6.1.1 Construct circuits in series and parallel"] }
        ]
      },
      {
        title: "5.7 SPREADSHEET",
        subtopics: [
          { title: "5.7.1 Addition and Subtraction in Spreadsheet", competencies: ["5.7.1.1 Perform addition and subtraction in spreadsheet"] }
        ]
      },
      {
        title: "5.8 GRAPHIC COMMUNICATION",
        subtopics: [
          { title: "5.8.1 Polygons", competencies: ["5.8.1.1 Construct regular polygons"] },
          { title: "5.8.2 Irregular Polygons", competencies: ["5.8.2.1 Construct irregular polygons"] },
          { title: "5.8.3 Pictorial Drawing", competencies: ["5.8.3.1 Construct objects in pictorial view", "5.8.3.2 Apply rendering on pictorial drawings"] },
          { title: "5.8.4 Image Editing Tools", competencies: ["5.8.4.1 Edit images"] }
        ]
      },
      {
        title: "5.9 TECHNOLOGY",
        subtopics: [
          { title: "5.9.1 Sustainable Technology", competencies: ["5.9.1.1 Use sustainable technology"] }
        ]
      },
      {
        title: "5.10 CODING",
        subtopics: [
          { title: "5.10.1 Block-Based Coding", competencies: ["5.10.1.1 Animate situations"] }
        ]
      },
      {
        title: "5.11 STRUCTURES",
        subtopics: [
          { title: "5.11.1 Designing Structures", competencies: ["5.11.1.1 Make strong and stable structures"] },
          { title: "5.11.2 Site Preparation", competencies: ["5.11.2.1 Prepare a site for construction"] }
        ]
      },
      {
        title: "5.12 INTERNET",
        subtopics: [
          { title: "5.12.1 Online Communication", competencies: ["5.12.1.1 Use online communication tools responsibly"] }
        ]
      },
      {
        title: "5.13 ENTREPRENEURSHIP",
        subtopics: [
          { title: "5.13.1 Marketing", competencies: ["5.13.1.1 Design a marketing plan"] }
        ]
      },
      {
        title: "REFERENCES",
        subtopics: [
          {
            title: "General References",
            competencies: [
              "Curriculum Development Centre, (2024). Environmental Health and Pollution Management Education Framework, Ministry of Education, Lusaka: Zambia",
              "Ministry of Education, (2024) Zambia Education Curriculum Framework",
              "Ministry of Finance and National Development, (2022). Eighth National Development Plan, Republic of Zambia"
            ]
          }
        ]
      }
    ],
    "Zambian Languages": [
      {
        title: "5.1 LISTENING AND SPEAKING",
        subtopics: [
          { title: "5.1.1 STORIES", competencies: ["5.1.1.1 Narrate fiction and non-fiction stories", "5.1.1.2 Identify themes in stories and plays"] },
          { title: "5.1.2 INFORMATION AND EXPLANATIONS", competencies: ["5.1.2.1 Ask for and provide information on customs and traditions", "5.1.2.2 Show understanding of cultural norms and values", "5.1.2.3 Classify and sing traditional songs according to occasions"] },
          { title: "5.1.3 EMOTIONS", competencies: ["5.1.3.1 Use appropriate language to express satisfaction, surprise and sympathy"] },
          { title: "5.1.4 DRAMA", competencies: ["5.1.4.1 Act out stories and plays"] },
          { title: "5.1.5 DEBATE", competencies: ["5.1.5.1 Debate cross-cutting issues"] },
          { title: "5.1.6 ORAL REPORTING", competencies: ["5.1.6.1 Give oral reports on experienced events"] },
          { title: "5.1.7 DESCRIPTION", competencies: ["5.1.7.1 Describe activities and events"] },
          { title: "5.1.8 POETRY", competencies: ["5.1.8.1 Compose poems", "5.1.8.2 Compose praises"] }
        ]
      },
      {
        title: "5.2 READING",
        subtopics: [
          { title: "5.2.1 READING FLUENCY", competencies: ["5.2.1.1 Read aloud with acceptable pronunciation and appropriate expression"] },
          { title: "5.2.2 REFERENCES", competencies: ["5.2.2.1 Use reference and textbooks effectively"] }
        ]
      },
      {
        title: "5.3 VOCABULARY",
        subtopics: [
          { title: "5.3.1 MEANING", competencies: ["5.3.1.1 Use a variety of grade level vocabulary", "5.3.1.2 Spell words"] },
          { title: "5.3.2 WORD RELATIONSHIPS", competencies: ["5.3.2.1 Use synonyms", "5.3.2.2 Use antonyms"] },
          { title: "5.3.3 NUMBERS", competencies: ["5.3.3.1 Count in a Zambian Language"] },
          { title: "5.3.4 CALENDAR", competencies: ["5.3.4.1 Name months of the year"] }
        ]
      },
      {
        title: "5.4 COMPREHENSION",
        subtopics: [
          { title: "5.4.1 LISTENING COMPREHENSION", competencies: ["5.4.1.1 Identify specific information read out or told"] },
          { title: "5.4.2 READING COMPREHENSION", competencies: ["5.4.2.1 Read grade level texts with understanding", "5.4.2.2 Read different types of materials for different purposes"] }
        ]
      },
      {
        title: "5.5 WRITING",
        subtopics: [
          { title: "5.5.1 HANDWRITING", competencies: ["5.5.1.1 Write legibly in cursive form"] },
          { title: "5.5.2 COMPOSITION", competencies: ["5.5.2.1 Write a narrative composition", "5.5.2.2 Write a description of an event", "5.5.2.3 Write a simple report on witnessed events", "5.5.2.4 Write a semi-formal letter"] },
          { title: "5.5.3 SUMMARY", competencies: ["5.5.3.1 Summarise a given grade level text", "5.5.3.2 Summarise a given grade level text (Prose)"] },
          { title: "5.5.4 FUNCTIONAL WRITING", competencies: ["5.5.4.1 Write notices, advertisements and tables"] },
          { title: "5.5.5 DICTATION", competencies: ["5.5.5.1 Write dictated simple paragraphs"] },
          { title: "5.5.6 TRANSLATION", competencies: ["5.5.6.1 Translate sentences and simple paragraphs from English into a Zambian language"] },
          { title: "5.5.7 DOCUMENTS", competencies: ["5.5.7.1 Fill in forms correctly"] }
        ]
      },
      {
        title: "5.6 LANGUAGE STRUCTURE",
        subtopics: [
          { title: "5.6.1 TENSES", competencies: ["5.6.1.1 Identify the present tense marker", "5.6.1.2 Identify the past tense marker", "5.6.1.3 Identify the future tense marker"] },
          { title: "5.6.2 DIRECT AND INDIRECT SPEECH", competencies: ["5.6.2.1 Change direct speech to indirect speech", "5.6.2.2 Change indirect speech to direct speech"] },
          { title: "5.6.3 NOUNS", competencies: ["5.6.3.1 Use compound nouns"] },
          { title: "5.6.4 CONCORD", competencies: ["5.6.4.1 Use subject-verb concord"] },
          { title: "5.6.5 INTERROGATIVES", competencies: ["5.6.5.1 Use interrogatives"] },
          { title: "5.6.6 PUNCTUATION", competencies: ["5.6.6.1 Use punctuation marks"] },
          { title: "5.6.7 VOWELS", competencies: ["5.6.7.1 Use vowel length to distinguish word meaning"] },
          { title: "5.6.8 ADJECTIVES", competencies: ["5.6.8.1 Use adjectives to qualify nouns"] },
          { title: "5.6.9 BORROWED WORDS", competencies: ["5.6.9.1 Use words that have been adapted from other languages"] },
          { title: "5.6.10 CONJUNCTIONS", competencies: ["5.6.10.1 Identify and use conjunctions"] },
          { title: "5.6.11 ADVERBS", competencies: ["5.6.11.1 Identify and use adverbs of manner", "5.6.11.2 Identify and use adverbs of frequency"] },
          { title: "5.6.12 PRONOUNS", competencies: ["5.6.12.1 Identify and use personal pronouns"] },
          { title: "5.6.13 FIGURES OF SPEECH", competencies: ["5.6.13.1 Use irony and hyperbole"] },
          { title: "5.6.14 IDIOMS", competencies: ["5.6.14.1 Interpret idioms"] },
          { title: "5.6.15 IDEOPHONES", competencies: ["5.6.15.1 Identify ideophones"] }
        ]
      }
    ]
  },
  "Grade 6 (Upper Primary)": {
    "Home Economics & Hospitality": homeEconomicsHospitalityGrade6,
    "English": englishGrade6CBC,
    "Zambian language": zambianLangGrade6Unpacked,
    "Mathematics": [
      {
        title: "6.1 SETS",
        subtopics: [
          { title: "6.1.1 Subsets", competencies: ["6.1.1.1 Apply the concept of subsets in life context"] }
        ]
      },
      {
        title: "6.2 INDEX NOTATION",
        subtopics: [
          { title: "6.2.1 Indices", competencies: ["6.2.1.1 Use index notation to solve life situations"] },
          { title: "6.2.2 Numbered Sequence", competencies: ["6.2.2.1 Use squares and cubes to generate sequences"] }
        ]
      },
      {
        title: "6.3 FRACTIONS",
        subtopics: [
          { title: "6.3.1 Common Fractions and Percentages", competencies: ["6.3.1.1 Apply fractions in different contexts"] }
        ]
      },
      {
        title: "6.4 INTEGERS",
        subtopics: [
          { title: "6.4.1 Operations on Integers", competencies: ["6.4.1.1 Use integers in different contexts"] }
        ]
      },
      {
        title: "6.5 ESTIMATION AND APPROXIMATIONS",
        subtopics: [
          { title: "6.5.1 Estimation and Approximation", competencies: ["6.5.1.1 Apply estimation and approximation in daily life"] }
        ]
      },
      {
        title: "6.6 RATIO AND PROPORTION",
        subtopics: [
          { title: "6.6.1 Ratio and Direct Proportion", competencies: ["6.6.1.1 Use the concept of ratio and proportion in everyday situations"] },
          { title: "6.6.2 Indirect Proportion", competencies: ["6.6.2.1 Apply indirect proportion in life situations"] }
        ]
      },
      {
        title: "6.7 EQUATIONS AND INEQUATIONS",
        subtopics: [
          { title: "6.7.1 Linear Equations and Inequations", competencies: ["6.7.1.1 Apply linear equations and inequations in life situations"] }
        ]
      },
      {
        title: "6.8 FINANCIAL ARITHMETIC",
        subtopics: [
          { title: "6.8.1 Money", competencies: ["6.8.1.1 Exhibit financial literacy in everyday life"] }
        ]
      },
      {
        title: "6.9 MEASURES",
        subtopics: [
          { title: "6.9.1 Length, Area and Speed", competencies: ["6.9.1.1 Apply measurements in different life contexts"] }
        ]
      },
      {
        title: "6.10 STATISTICS",
        subtopics: [
          { title: "6.10.1 Measures of Central Tendency", competencies: ["6.10.1.1 Analyse data"] },
          { title: "6.10.2 Stem-Leaf Plot and Pie Chart", competencies: ["6.10.2.1 Present data in different forms"] },
          { title: "6.10.3 Statistics", competencies: ["6.10.3.1 Collect and represent data using line graphs"] }
        ]
      }
    ],
    "Science": [
      {
        title: "6.1 THE HUMAN BODY",
        subtopics: [
          { title: "6.1.1 The Digestive System", competencies: ["6.1.1.1 Demonstrate understanding of the digestive system of the human body"] },
          { title: "6.1.2 Risk of Teenage Pregnancy", competencies: ["6.1.2.1 Examine risks associated with teenage pregnancy"] }
        ]
      },
      {
        title: "6.2 NUTRITION AND HEALTH",
        subtopics: [
          { title: "6.2.1 Health Risks Associated with Nutrition", competencies: ["6.2.1.1 Relate nutritional disorders to poor nutrition in human beings"] },
          { title: "6.2.2 Tuberculosis", competencies: ["6.2.2.1 Practise effective ways of preventing the spread of Tuberculosis in the community"] },
          { title: "6.2.3 Bacteria, Fungi and Viruses", competencies: ["6.2.3.1 Classify bacteria, fungi and viruses based on their structure and mode of infection"] }
        ]
      },
      {
        title: "6.3 THE ENVIRONMENT",
        subtopics: [
          { title: "6.3.1 Environmental Management", competencies: ["6.3.1.1 Develop sustainable practices and approaches in environmental management"] },
          { title: "6.3.2 Water Supply Systems", competencies: ["6.3.2.1 Examine different water supply systems", "6.3.2.2 Explore water conservation methods in homes and communities"] }
        ]
      },
      {
        title: "6.4 PLANTS AND ANIMALS",
        subtopics: [
          { title: "6.4.1 Reproduction in Flowering Plants", competencies: ["6.4.1.1 Investigate the reproductive parts in flowering plants", "6.4.1.2 Determine methods of dispersal based on the structure of the seed", "6.4.1.3 Explore different methods of propagating plants found in the environment"] },
          { title: "6.4.2 Soil Erosion and Conservation", competencies: ["6.4.2.1 Practice soil conservation"] },
          { title: "6.4.3 Crops", competencies: ["6.4.3.1 Grow different field crops to maturity"] },
          { title: "6.4.4 Crop Diversification", competencies: ["6.4.4.1 Grow drought-resistant crops"] },
          { title: "6.4.5 Agro-processing and Entrepreneurship", competencies: ["6.4.5.1 Develop innovations in Agro-processing and entrepreneurship"] },
          { title: "6.4.6 Small-Stock Production", competencies: ["6.4.6.1 Rear small-stock"] }
        ]
      },
      {
        title: "6.5 MATERIALS AND ENERGY",
        subtopics: [
          { title: "6.5.1 Sustainable Energy Conservation", competencies: ["6.5.1.1 Practice efficient energy conserving methods"] },
          { title: "6.5.2 Simple Machines", competencies: ["6.5.2.1 Use simple machines to do work"] },
          { title: "6.5.3 Basic Astronomy", competencies: ["6.5.3.1 Demonstrate understanding of the relationship between the earth, moon and the sun in the galaxy"] },
          { title: "6.5.4 Technological Advancement", competencies: ["6.5.4.1 Design prototypes of robots"] },
          { title: "6.5.5 Sound", competencies: ["6.5.5.1 Evaluate the sources and properties of sound"] },
          { title: "6.5.6 Magnetism", competencies: ["6.5.6.1 Apply the principles of magnetism"] }
        ]
      }
    ],
    "Social Studies": [
      {
        title: "6.1 TOGETHERNESS",
        subtopics: [
          { title: "6.1.1 Togetherness in the Community", competencies: ["6.1.1.1 Demonstrate sense of belonging"] },
          { title: "6.1.2 Factors that Promote Living Together", competencies: ["6.1.2.1 Practise living together"] },
          { title: "6.1.3 Importance of Living Together", competencies: ["6.1.3.1 Examine importance of living together"] },
          { title: "6.1.4 Living Together in Different Religions", competencies: ["6.1.4.1 Examine activities that promote living together"] }
        ]
      },
      {
        title: "6.2 GOVERNANCE",
        subtopics: [
          { title: "6.2.1 Democratic Governance", competencies: ["6.2.1.1 Practise democratic governance"] },
          { title: "6.2.2 Organs of Government", competencies: ["6.2.2.1 Examine different organs of government"] },
          { title: "6.2.3 Government Ministries", competencies: ["6.2.3.1 Demonstrate understanding of government ministries"] },
          { title: "6.2.4 Constitution", competencies: ["6.2.4.1 Obey laws of the country"] },
          { title: "6.2.5 Child Abuse", competencies: ["6.2.5.1 Practise protecting oneself from being abused"] },
          { title: "6.2.6 Corruption", competencies: ["6.2.6.1 Practise ways of fighting corruption"] },
          { title: "6.2.7 School Related Gender-Based Violence", competencies: ["6.2.7.1 Practise ways of protecting oneself against School Related Gender-Based Violence"] }
        ]
      },
      {
        title: "6.3 LEARNING ABOUT THE PAST",
        subtopics: [
          { title: "6.3.1 The Bantu Speaking People of Zambia", competencies: ["6.3.1.1 Explore way of life of the Bantu speaking people"] }
        ]
      },
      {
        title: "6.4 TRANSPORT AND COMMUNICATION",
        subtopics: [
          { title: "6.4.1 Transport and Communication Services in the SADC and COMESA Countries", competencies: ["6.4.1.1 Analyse benefits of improved transport and communication services"] },
          { title: "6.4.2 Road Safety", competencies: ["6.4.2.1 Practise road safety when cycling"] }
        ]
      },
      {
        title: "6.5 CLIMATE CHANGE",
        subtopics: [
          { title: "6.5.1 Mitigating Climate Change", competencies: ["6.5.1.1 Practise ways that help reduce climate change"] },
          { title: "6.5.2 Adapting to Climate Change", competencies: ["6.5.2.1 Adapt to extreme weather conditions and disasters"] }
        ]
      },
      {
        title: "6.6 ENVIRONMENT",
        subtopics: [
          { title: "6.6.1 Keeping the environment clean", competencies: ["6.6.1.1 Practise ways of keeping the environment clean"] }
        ]
      },
      {
        title: "6.7 LEARNING ABOUT MONEY",
        subtopics: [
          { title: "6.7.1 Saving Money", competencies: ["6.7.1.1 Evaluate different ways of saving money"] }
        ]
      },
      {
        title: "6.8 THE WORLD",
        subtopics: [
          { title: "6.8.1 Continents", competencies: ["6.8.1.1 Locate continents on the World map"] },
          { title: "6.8.2 Physical Features of Africa", competencies: ["6.8.2.1 Draw map showing physical features of Africa"] }
        ]
      },
      {
        title: "6.9 AFRICAN CHALLENGES",
        subtopics: [
          { title: "6.9.1 Population Growth", competencies: ["6.9.1.1 Examine causes of rapid population growth", "6.9.1.2 Evaluate effects of rapid population growth"] },
          { title: "6.9.2 Rural-Urban Migration", competencies: ["6.9.2.1 Analyse rural-urban migration"] },
          { title: "6.9.3 Food Shortages", competencies: ["6.9.3.1 Practise ways of contributing to food security"] },
          { title: "6.9.4 HIV and AIDS", competencies: ["6.9.4.1 Demonstrate understanding of ways to prevent HIV and AIDS"] },
          { title: "6.9.5 War", competencies: ["6.9.5.1 Analyse causes and effects of war in Africa"] }
        ]
      }
    ],
    "Expressive Arts": expressiveArtsGrade6,
    "Technology Studies": [
      {
        title: "6.1 SAFETY",
        subtopics: [
          { title: "6.1.1 First Aid", competencies: ["6.1.1.1 Apply First Aid"] }
        ]
      },
      {
        title: "6.2 WORD PROCESSING",
        subtopics: [
          { title: "6.2.1 Document Collaboration", competencies: ["6.2.1.1 Perform collaborative document editing and version control"] }
        ]
      },
      {
        title: "6.3 TOOLS AND EQUIPMENT",
        subtopics: [
          { title: "6.3.1 Building Tools", competencies: ["6.3.1.1 Classify building tools"] }
        ]
      },
      {
        title: "6.4 MATERIALS",
        subtopics: [
          { title: "6.4.1 Building Materials", competencies: ["6.4.1.1 Classify building materials", "6.4.1.2 Make bricks"] }
        ]
      },
      {
        title: "6.5 PRESENTATION",
        subtopics: [
          { title: "6.5.1 Animations", competencies: ["6.5.1.1 Create interactive presentations"] }
        ]
      },
      {
        title: "6.6 ENERGY",
        subtopics: [
          { title: "6.6.1 Installation of Electrical Components", competencies: ["6.6.1.1 Install electrical components"] }
        ]
      },
      {
        title: "6.7 SPREADSHEET",
        subtopics: [
          { title: "6.7.1 Multiplication and Division in Spreadsheet", competencies: ["6.7.1.1 Perform multiplication and division in spreadsheet"] }
        ]
      },
      {
        title: "6.8 GRAPHIC COMMUNICATION",
        subtopics: [
          { title: "6.8.1 Orthographic Projection", competencies: ["6.8.1.1 Construct orthographic views"] },
          { title: "6.8.2 Modelling", competencies: ["6.8.2.1 Create 3D models"] }
        ]
      },
      {
        title: "6.9 DESIGNING",
        subtopics: [
          { title: "6.9.1 Product Design", competencies: ["6.9.1.1 Design products to solve real life problems"] }
        ]
      },
      {
        title: "6.10 CODING",
        subtopics: [
          { title: "6.10.1 Block Based Coding", competencies: ["6.10.1.1 Create simple computer programs"] }
        ]
      },
      {
        title: "6.11 STRUCTURES",
        subtopics: [
          { title: "6.11.1 Building Structures", competencies: ["6.11.1.1 Construct buildings"] }
        ]
      },
      {
        title: "6.12 INTERNET",
        subtopics: [
          { title: "6.12.1 Digital Citizenship", competencies: ["6.12.1.1 Apply digital citizenship ethics"] }
        ]
      },
      {
        title: "6.13 ENTREPRENEURSHIP",
        subtopics: [
          { title: "6.13.1 Business Plan", competencies: ["6.13.1.1 Develop business plans"] }
        ]
      },
      {
        title: "REFERENCES",
        subtopics: [
          {
            title: "General References",
            competencies: [
              "Curriculum Development Centre, (2024). Environmental Health and Pollution Management Education Framework, Ministry of Education, Lusaka: Zambia",
              "Ministry of Education, (2024) Zambia Education Curriculum Framework",
              "Ministry of Finance and National Development, (2022). Eighth National Development Plan, Republic of Zambia"
            ]
          }
        ]
      }
    ],
    "Zambian Languages": [
      {
        title: "6.1 LISTENING AND SPEAKING",
        subtopics: [
          { title: "6.1.1 STORIES", competencies: ["6.1.1.1 Narrate fiction and non-fiction stories", "6.1.1.2 Analyse a story"] },
          { title: "6.1.2 INFORMATION AND EXPLANATIONS", competencies: ["6.1.2.1 Use appropriate language to ask and provide information"] },
          { title: "6.1.3 EMOTIONS", competencies: ["6.1.3.1 Use appropriate language to express different emotions"] },
          { title: "6.1.4 DRAMATIZING PLAYS", competencies: ["6.1.4.1 Act in plays"] },
          { title: "6.1.5 DEBATE", competencies: ["6.1.5.1 Debate issues on national values and principles"] },
          { title: "6.1.6 ORAL REPORTS", competencies: ["6.1.6.1 Give oral reports on cross-cutting issues"] },
          { title: "6.1.7 CUSTOMS AND TRADITIONS", competencies: ["6.1.7.1 Show understanding of cultural norms and values related to personal conduct", "6.1.7.2 Compose simple traditional songs"] },
          { title: "6.1.8 DESCRIPTION", competencies: ["6.1.8.1 Describe processes"] },
          { title: "6.1.9 POETRY", competencies: ["6.1.9.1 Compose and recite simple poems", "6.1.9.2 Compose and recite simple praises"] }
        ]
      },
      {
        title: "6.2 READING",
        subtopics: [
          { title: "6.2.1 READING FLUENCY", competencies: ["6.2.1.1 Read texts aloud with acceptable pronunciation and appropriate expression"] },
          { title: "6.2.2 REFERENCES", competencies: ["6.2.2.1 Use reference and textbooks"] }
        ]
      },
      {
        title: "6.3 VOCABULARY",
        subtopics: [
          { title: "6.3.1 MEANING", competencies: ["6.3.1.1 Use a variety of grade level vocabulary", "6.3.1.2 Spell words"] },
          { title: "6.3.2 WORD RELATIONSHIPS", competencies: ["6.3.2.1 Identify and use homonyms"] },
          { title: "6.3.3 NUMBERS", competencies: ["6.3.3.1 Count in a Zambian Language"] },
          { title: "6.3.4 CALENDAR", competencies: ["6.3.4.1 Name seasons of the year"] },
          { title: "6.3.5 DIRECTIONS", competencies: ["6.3.5.1 Show directions using cardinal points"] }
        ]
      },
      {
        title: "6.4 COMPREHENSION",
        subtopics: [
          { title: "6.4.1 LISTENING COMPREHENSION", competencies: ["6.4.1.1 Listen to information read out or told"] },
          { title: "6.4.2 READING COMPREHENSION", competencies: ["6.4.2.1 Read grade level texts with understanding", "6.4.2.2 Read different types of materials for different purposes"] }
        ]
      },
      {
        title: "6.5 WRITING",
        subtopics: [
          { title: "6.5.1 HANDWRITING", competencies: ["6.5.1.1 Write legibly in cursive form"] },
          { title: "6.5.2 COMPOSITION", competencies: ["6.5.2.1 Write a narrative", "6.5.2.2 Write a formal letter", "6.5.2.3 Write a descriptive composition", "6.5.2.4 Write simple reports"] },
          { title: "6.5.3 DICTATION", competencies: ["6.5.3.1 Write dictated paragraphs"] },
          { title: "6.5.4 TRANSLATION", competencies: ["6.5.4.1 Translate simple passages from English into a Zambian language"] },
          { title: "6.5.5 DOCUMENTS", competencies: ["6.5.5.1 Fill in forms"] },
          { title: "6.5.6 FINANCIAL DOCUMENTS", competencies: ["6.5.6.1 Write a simple business plan"] },
          { title: "6.5.7 SUMMARY", competencies: ["6.5.7.1 Summarise a given grade level text (Note)", "6.5.7.2 Summarise a given grade level text (Prose)"] },
          { title: "6.5.8 DRAMA", competencies: ["6.5.8.1 Write a short play"] }
        ]
      },
      {
        title: "6.6 LANGUAGE STRUCTURE",
        subtopics: [
          { title: "6.6.1 DIRECT AND INDIRECT SPEECH", competencies: ["6.6.1.1 Change direct speech to indirect speech", "6.6.1.2 Change indirect speech to direct speech"] },
          { title: "6.6.2 AFFIXATION", competencies: ["6.6.2.1 Use prefixes to express augmentation", "6.6.2.2 Use prefixes to express diminutive forms", "6.6.2.3 Use prefixes to express pejorative forms"] },
          { title: "6.6.3 NOUNS", competencies: ["6.6.3.1 Use collective nouns"] },
          { title: "6.6.4 CONCORD", competencies: ["6.6.4.1 Use subject-verb concord"] },
          { title: "6.6.5 PUNCTUATION", competencies: ["6.6.5.1 Use punctuation marks"] },
          { title: "6.6.6 ADJECTIVES", competencies: ["6.6.6.1 Classify adjectives according to type"] },
          { title: "6.6.7 ADVERBS", competencies: ["6.6.7.1 Use adverbs of degree"] },
          { title: "6.6.8 PRONOUNS", competencies: ["6.6.8.1 Use reflexive pronouns"] },
          { title: "6.6.9 VERBS", competencies: ["6.6.9.1 Build a verb from its root", "6.6.9.2 Express active and passive forms of the verb in sentences"] },
          { title: "6.6.10 FIGURES OF SPEECH", competencies: ["6.6.10.1 Use figures of speech"] },
          { title: "6.6.11 PROVERBS AND SAYINGS", competencies: ["6.6.11.1 Apply proverbs and sayings in different situations"] },
          { title: "6.6.12 IDIOMS", competencies: ["6.6.12.1 Apply idioms to different situations"] }
        ]
      }
    ]
  },
  "Grade 7 (Upper Primary)": {
    "Integrated science": integratedScienceGrade7,
    "Technology studies": obeCreativeTechGrade7,
    "English": englishGrade7CBC,
    "Zambian language": zambianLangGrade7Unpacked,
    "Home Economics & Hospitality": cbcHomeEconomicsHospitalityGrade7,
    "Expressive Arts": expressiveArtsGrade7,
    "Mathematics": mathOBCGrade7,
    "Social studies": obcSocialStudiesGrade7
  },
  "ece, section A (3-4years)": {
    "Creative and technology studies": eceCreativeTechSectionA,
    "Zambian language": eceZambianLanguageSectionA,
    "English": eceEnglishSectionA,
    "Pre-Mathematics & Science": ecePreMathematicsSectionA,
    "Social, Emotional and Spiritual Development": eceSocialEmotionalSectionA
  },
  "ece, section B (4-5 years)": {
    "Creative and technology studies": eceCreativeTechSectionB,
    "Zambian language": eceZambianLanguageSectionB,
    "English": eceEnglishSectionB,
    "Pre-Mathematics & Science": ecePreMathematicsSectionB,
    "Social, Emotional and Spiritual Development": eceSocialEmotionalSectionB
  },
  "Form 1 O Level": {
    "Biology": biologyForm1,
    "Chemistry": chemistryForm1,
    "Civic Education": civicEducationForm1,
    "Commerce": commerceForm1,
    "Principles of Accounts": principlesOfAccountsForm1,
    "Computer Science": computerScienceForm1,
    "English": englishLanguageForm1,
    "Food and Nutrition": foodNutritionForm1,
    "Geography": geographyForm1,
    "History": historyForm1,
    "Hospitality Management": hospitalityManagementForm1,
    "Information and Communication Technology (ICT)": ictForm1,
    "Literature in English": literatureForm1,
    "Mathematics 1": mathematics1Form1,
    "Mathematics 2": mathematics2Form1,
    "Musical Arts": musicArtsForm1,
    "Physical Education": physicalEducationForm1,
    "Physics": physicsForm1,
    "Religious Education": religiousEducationForm1,
    "Travel and Tourism": travelTourismForm1,
    "Zambian Languages": zambianLanguagesForm1,
    "Agriculture Science": agricultureScienceForm1,
    "Art and Design": artDesignForm1,
    "Design and Technology": designTechnologyForm1,
    "Fashion and Fabrics": fashionFabricsForm1,
    "French Language": frenchLanguageForm1
  },
  "Form 2 O Level": {
    "Biology": biologyForm2,
    "Chemistry": chemistryForm2,
    "Civic Education": civicEducationForm2,
    "Commerce": commerceForm2,
    "Principles of Accounts": principlesOfAccountsForm2,
    "Computer Science": computerScienceForm2,
    "English": englishLanguageForm2,
    "Food and Nutrition": foodNutritionForm2,
    "Geography": geographyForm2,
    "History": historyForm2,
    "Hospitality Management": hospitalityManagementForm2,
    "Information and Communication Technology (ICT)": ictForm2,
    "Literature in English": literatureForm2,
    "Mathematics 1": mathematics1Form2,
    "Mathematics 2": mathematics2Form2,
    "Musical Arts": musicArtsForm2,
    "Physical Education": physicalEducationForm2,
    "Physics": physicsForm2,
    "Religious Education": religiousEducationForm2,
    "Travel and Tourism": travelTourismForm2,
    "Zambian Languages": zambianLanguagesForm2,
    "Agriculture Science": agricultureScienceForm2,
    "Art and Design": artDesignForm2,
    "Design and Technology": designTechnologyForm2,
    "Fashion and Fabrics": fashionFabricsForm2,
    "French Language": frenchLanguageForm2
  },
  "Form 3 O Level": {
    "Biology": biologyForm3,
    "Chemistry": chemistryForm3,
    "Civic Education": civicEducationForm3,
    "Commerce": commerceForm3,
    "Principles of Accounts": principlesOfAccountsForm3,
    "Computer Science": computerScienceForm3,
    "English": englishLanguageForm3,
    "Food and Nutrition": foodNutritionForm3,
    "Geography": geographyForm3,
    "History": historyForm3,
    "Hospitality Management": hospitalityManagementForm3,
    "Information and Communication Technology (ICT)": ictForm3,
    "Literature in English": literatureForm3,
    "Mathematics 1": mathematics1Form3,
    "Mathematics 2": mathematics2Form3,
    "Musical Arts": musicArtsForm3,
    "Physical Education": physicalEducationForm3,
    "Physics": physicsForm3,
    "Religious Education": religiousEducationForm3,
    "Travel and Tourism": travelTourismForm3,
    "Zambian Languages": zambianLanguagesForm3,
    "Agriculture Science": agricultureScienceForm3,
    "Art and Design": artDesignForm3,
    "Design and Technology": designTechnologyForm3,
    "Fashion and Fabrics": fashionFabricsForm3,
    "French Language": frenchLanguageForm3
  },
  "Form 4 O Level": {
    "Biology": biologyForm4,
    "Chemistry": chemistryForm4,
    "Civic Education": civicEducationForm4,
    "Commerce": commerceForm4,
    "Principles of Accounts": principlesOfAccountsForm4,
    "Computer Science": computerScienceForm4,
    "English": englishLanguageForm4,
    "Food and Nutrition": foodNutritionForm4,
    "Geography": geographyForm4,
    "History": historyForm4,
    "Hospitality Management": hospitalityManagementForm4,
    "Information and Communication Technology (ICT)": ictForm4,
    "Literature in English": literatureForm4,
    "Mathematics 1": mathematics1Form4,
    "Mathematics 2": mathematics2Form4,
    "Musical Arts": musicArtsForm4,
    "Physical Education": physicalEducationForm4,
    "Physics": physicsForm4,
    "Religious Education": religiousEducationForm4,
    "Travel and Tourism": travelTourismForm4,
    "Zambian Languages": zambianLanguagesForm4,
    "Agriculture Science": agricultureScienceForm4,
    "Art and Design": artDesignForm4,
    "Design and Technology": designTechnologyForm4,
    "Fashion and Fabrics": fashionFabricsForm4,
    "French Language": frenchLanguageForm4
  },
  "Grade 4": {
    "English": englishGrade4CBC,
    "Mathematics": mathOBCGrade4,
    "Science": scienceGrade4OBC,
    "Social studies": socialStudiesGrade4,
    "Home Economics & Hospitality": homeEconomicsHospitalityGrade4,
    "Technology studies": obeCreativeTechGrade4,
    "Expressive Arts": expressiveArtsGrade4,
    "Zambian language": zambianLangGrade4Unpacked
  },
  "Grade 5": {
    "Integrated science": integratedScienceGrade5,
    "Technology studies": obeCreativeTechGrade5,
    "English": englishGrade5CBC,
    "Zambian language": zambianLangGrade5Unpacked,
    "Home Economics & Hospitality": homeEconomicsHospitalityGrade5,
    "Expressive Arts": expressiveArtsGrade5,
    "Social studies": socialStudiesGrade5,
    "Mathematics": mathOBCGrade5
  },
  "Grade 6": {
    "Integrated science": integratedScienceGrade6,
    "Technology studies": obeCreativeTechGrade6,
    "English": englishGrade6CBC,
    "Zambian language": zambianLangGrade6Unpacked,
    "Home Economics & Hospitality": homeEconomicsHospitalityGrade6,
    "Expressive Arts": expressiveArtsGrade6,
    "Social studies": socialStudiesGrade6,
    "Mathematics": mathOBCGrade6
  },
  "Grade 7": {
    "Integrated science": integratedScienceGrade7,
    "Technology studies": obeCreativeTechGrade7,
    "English": englishGrade7CBC,
    "Zambian language": zambianLangGrade7Unpacked,
    "Home Economics & Hospitality": cbcHomeEconomicsHospitalityGrade7,
    "Expressive Arts": expressiveArtsGrade7,
    "Social studies": socialStudiesGrade7,
    "Mathematics": mathOBCGrade7
  }
};
