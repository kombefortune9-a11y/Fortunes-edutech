/**
 * Utility functions for parsing, cleaning, and extracting components
 * from raw syllabus competency strings that may contain piped metadata
 * such as | Expected Standard: ... | Learning Activities: ...
 */

export interface ParsedCompetencyData {
  briefCompetency: string; // Brief competency statement without piped metadata
  expectedStandard?: string;
  learningActivities?: string[];
  knowledge?: string;
  skills?: string;
  values?: string;
}

/**
 * Parses a single raw competency string (which may contain piped segments)
 */
export function parseRawCompetency(raw: string): ParsedCompetencyData {
  if (!raw || typeof raw !== 'string') {
    return { briefCompetency: '' };
  }

  const parts = raw.split('|').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return { briefCompetency: '' };

  const briefCompetency = parts[0].trim();
  let expectedStandard: string | undefined = undefined;
  let learningActivities: string[] | undefined = undefined;
  let knowledge: string | undefined = undefined;
  let skills: string | undefined = undefined;
  let values: string | undefined = undefined;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (/^\[?\s*expected\s*standards?\s*\]?\s*:/i.test(part)) {
      expectedStandard = part.replace(/^\[?\s*expected\s*standards?\s*\]?\s*:\s*/i, '').trim();
    } else if (/^\[?\s*learning\s*activities\s*\]?\s*:/i.test(part)) {
      const actStr = part.replace(/^\[?\s*learning\s*activities\s*\]?\s*:\s*/i, '').trim();
      if (actStr) {
        learningActivities = actStr.split(/;|•|\n/).map(a => a.trim()).filter(Boolean);
      }
    } else if (/^\[?\s*knowledge\s*\]?\s*:/i.test(part)) {
      knowledge = part.replace(/^\[?\s*knowledge\s*\]?\s*:\s*/i, '').trim();
    } else if (/^\[?\s*skills?\s*\]?\s*:/i.test(part)) {
      skills = part.replace(/^\[?\s*skills?\s*\]?\s*:\s*/i, '').trim();
    } else if (/^\[?\s*values?\s*\]?\s*:/i.test(part)) {
      values = part.replace(/^\[?\s*values?\s*\]?\s*:\s*/i, '').trim();
    }
  }

  return {
    briefCompetency,
    expectedStandard,
    learningActivities,
    knowledge,
    skills,
    values
  };
}

/**
 * Returns only the brief competency statement from a raw string or multiline text
 */
export function extractBriefCompetencies(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .split('\n')
    .map(line => parseRawCompetency(line).briefCompetency)
    .filter(Boolean)
    .join('\n');
}

/**
 * Extracts all expected standards embedded in raw competency strings/text
 */
export function extractEmbeddedExpectedStandards(rawText: string | string[]): string[] {
  const lines = Array.isArray(rawText) ? rawText : (rawText || '').split('\n');
  const standards: string[] = [];
  lines.forEach(line => {
    const parsed = parseRawCompetency(line);
    if (parsed.expectedStandard) {
      standards.push(parsed.expectedStandard);
    }
  });
  return standards;
}

/**
 * Extracts all learning activities embedded in raw competency strings/text
 */
export function extractEmbeddedLearningActivities(rawText: string | string[]): string[] {
  const lines = Array.isArray(rawText) ? rawText : (rawText || '').split('\n');
  const activities: string[] = [];
  lines.forEach(line => {
    const parsed = parseRawCompetency(line);
    if (parsed.learningActivities && parsed.learningActivities.length > 0) {
      activities.push(...parsed.learningActivities);
    }
  });
  return activities;
}

/**
 * Extracts all knowledge statements embedded in raw competency strings/text
 */
export function extractEmbeddedKnowledge(rawText: string | string[]): string[] {
  const lines = Array.isArray(rawText) ? rawText : (rawText || '').split('\n');
  const knowledgeList: string[] = [];
  lines.forEach(line => {
    const parsed = parseRawCompetency(line);
    if (parsed.knowledge) {
      knowledgeList.push(parsed.knowledge);
    }
  });
  return knowledgeList;
}

/**
 * Formats General Competencies into concise short form,
 * trimming out long explanatory clauses (e.g. "by identifying...", "through discussing...").
 */
export function formatGeneralCompetenciesShortForm(text: string): string {
  if (!text || typeof text !== 'string') return '';

  const rawLines = text.split(/\n|<br\s*\/?>/i);
  const resultLines: string[] = [];

  for (const line of rawLines) {
    let trimmed = line.trim();
    if (!trimmed) continue;

    const bulletMatch = trimmed.match(/^([•\-\*]|&bull;)\s*/);
    const bullet = bulletMatch ? '- ' : '';
    let content = trimmed.replace(/^([•\-\*]|&bull;)\s*/, '').trim();

    // Strip long explanatory clauses that turn short skills into full sentences
    content = content
      .replace(/\s+(by|through|in order to|towards|so as to|for overall|to enable)\s+[\s\S]*/i, '')
      .replace(/\s+and\s+their\s+(functions|uses|applications).*/i, '')
      .replace(/[\.,;:]+$/, '')
      .trim();

    if (content) {
      resultLines.push(`${bullet}${content}`);
    }
  }

  if (resultLines.length === 0 && text.trim()) {
    let content = text.trim()
      .replace(/^([•\-\*]|&bull;)\s*/, '')
      .replace(/\s+(by|through|in order to|towards|so as to|for overall|to enable)\s+[\s\S]*/i, '')
      .replace(/[\.,;:]+$/, '')
      .trim();
    return content;
  }

  return resultLines.join('\n');
}

/**
 * Constructs the exact official syllabus citation reference format based on Curriculum (CBC vs OBC),
 * Grade level, Subject name, and optional page number according to national CDC guidelines.
 * Short reference format throughout schemes of work, weekly forecast, and lesson plans.
 * Page Rule: Uses exact page number if located; otherwise uses dotted lines 'page:......'.
 * Upload/Paste Rule: Adds indication if coming from upload or paste methods.
 */
export function getOfficialSyllabusCitation(
  grade: string,
  subject: string,
  curriculumType: 'CBC' | 'OBC' | string = 'CBC',
  page?: string | number,
  isFromUploadOrPaste?: boolean
): string {
  const gNorm = (grade || '').trim();
  const gLow = gNorm.toLowerCase();
  const sRaw = (subject || '').trim() || 'Subject';
  const sLow = sRaw.toLowerCase();

  // Special rule: Oral English and Literacy in English fall under "English Language" as main subject
  const isOral = sLow.includes('oral english') || sLow.includes('oral component');
  const isLiteracy = sLow.includes('literacy') || sLow.includes('english literacy');
  const primarySubject = (isOral || isLiteracy) ? 'English language' : sRaw;

  // Format page string: use exact page number if provided & valid; otherwise use dotted lines
  const pClean = page !== undefined && page !== null ? String(page).trim() : '';
  const hasPage = pClean !== '' && pClean !== '.....' && !pClean.includes('....') && !pClean.includes('...');
  const uploadSuffix = '';
  const isOBC = curriculumType === 'OBC' || gLow.includes('obc') || gLow.includes('obe');

  if (isOBC) {
    // OUTCOME BASED CURRICULUM (OBC - 2013 Syllabus)
    const pageVal = hasPage ? ` ${pClean}` : '......';
    if (gLow.includes('grade 5') || gLow.includes('grade 6') || gLow.includes('grade 7') || gLow.includes('upper primary') || gLow === '5' || gLow === '6' || gLow === '7') {
      return `- Grade 5 to 7 ${primarySubject.toLowerCase()} syllabus page:${pageVal}${uploadSuffix}`;
    } else if (gLow.includes('grade 10') || gLow.includes('grade 11') || gLow.includes('grade 12') || gLow.includes('form') || gLow.includes('senior')) {
      return `- it's grade 11 to 12 ${primarySubject.toLowerCase()} 2 syllabus page:${pageVal}${uploadSuffix}`;
    } else if (gLow.includes('grade 8') || gLow.includes('grade 9') || gLow.includes('junior')) {
      return `- grade 8 to 9 ${primarySubject.toLowerCase()} syllabus page:${pageVal}${uploadSuffix}`;
    } else {
      // primary: Grade 1 to 4
      return `- Grade 1 to 4 ${primarySubject.toLowerCase()} syllabus page:${pageVal}${uploadSuffix}`;
    }
  } else {
    // COMPETENCY BASED CURRICULUM (CBC - 2024-2025 Syllabus)
    if (gLow.includes('ece') || gLow.includes('baby') || gLow.includes('middle') || gLow.includes('reception') || gLow.includes('3-5') || gLow.includes('early')) {
      const pageVal = hasPage ? ` ${pClean}` : '......';
      const eceSubject = (sLow.includes('math') || sLow.includes('science')) ? 'mathematics and science' : primarySubject.toLowerCase();
      return `- ECE levels 1-2 ${eceSubject} syllabus page:${pageVal}${uploadSuffix}`;
    } else if (
      gLow.includes('grade 1') || gLow.includes('grade 2') || gLow.includes('grade 3') ||
      gLow.includes('lower primary') || gLow === '1' || gLow === '2' || gLow === '3'
    ) {
      const pageVal = hasPage ? ` ${pClean}` : '.....';
      return `- Grade 1- 3 ${primarySubject.toLowerCase()} syllabus page:${pageVal}${uploadSuffix}`;
    } else if (
      gLow.includes('grade 4') || gLow.includes('grade 5') || gLow.includes('grade 6') ||
      gLow.includes('upper primary') || gLow === '4' || gLow === '5' || gLow === '6'
    ) {
      const pageVal = hasPage ? ` ${pClean}` : '......';
      return `- Grade 4-6 ${primarySubject.toLowerCase()} syllabus page:${pageVal}${uploadSuffix}`;
    } else if (
      gLow.includes('form 5') || gLow.includes('form 6') || gLow.includes('advanced')
    ) {
      const pageVal = hasPage ? ` ${pClean}` : '........';
      return `- Form 5-6 ${primarySubject.toLowerCase()} syllabus page:${pageVal}${uploadSuffix}`;
    } else if (
      gLow.includes('form') || gLow.includes('grade 7') || gLow.includes('grade 8') ||
      gLow.includes('grade 9') || gLow.includes('grade 10') || gLow.includes('secondary')
    ) {
      const pageVal = hasPage ? ` ${pClean}` : '....';
      return `- Form 1- 4 ${primarySubject.toLowerCase()} syllabus 1 page:${pageVal}${uploadSuffix}`;
    } else {
      const pageVal = hasPage ? ` ${pClean}` : '.....';
      return `- Grade 1- 3 ${primarySubject.toLowerCase()} syllabus page:${pageVal}${uploadSuffix}`;
    }
  }
}

/**
 * Short reference generator helper alias matching user specification
 */
export const formatShortZambianReference = getOfficialSyllabusCitation;

import { SYLLABI } from '../data/syllabi';

/**
 * Normalizes competency/outcome prefix based on curriculum type:
 * - Under CBC curriculum: MUST be Specific Competency (never Specific Outcome)
 * - Under OBC curriculum: MUST be Specific Outcome (never Specific Competency)
 */
export function formatCompetencyOrOutcomeForCurriculum(text: string, curriculumType?: string): string {
  if (!text) return '';
  const isOBC = curriculumType === 'OBC' || 
    (typeof curriculumType === 'string' && (curriculumType.toLowerCase().includes('obc') || curriculumType.toLowerCase().includes('obe')));
  if (isOBC) {
    return text.replace(/^Specific\s*Competenc(?:y|ies)\s*:\s*/i, 'Specific Outcome: ');
  } else {
    return text.replace(/^Specific\s*Outcomes?\s*:\s*/i, 'Specific Competency: ');
  }
}

export function getCompetenciesForSubtopic(topicTitle: string, subtopicTitle: string, _competencyTitle?: string, grade?: string, subject?: string): string[] {
  const isOBCGrade = grade ? (grade.toLowerCase().includes('obc') || grade.toLowerCase().includes('obe')) : false;
  const fallbackLabel = isOBCGrade ? `Achieve specific outcome in ${subtopicTitle}` : `Demonstrate competence in ${subtopicTitle}`;
  if (!grade || !subject) return [fallbackLabel];
  
  const rawSyllabi = SYLLABI[grade]?.[subject] || SYLLABI[grade]?.[subject.toLowerCase()] || [];
  for (const topic of rawSyllabi) {
    if (topic.title.toLowerCase().includes(topicTitle.toLowerCase()) || topicTitle.toLowerCase().includes(topic.title.toLowerCase())) {
      for (const sub of (topic.subtopics || [])) {
        const title = sub.title || (sub as any).name || '';
        if (title.toLowerCase().includes(subtopicTitle.toLowerCase()) || subtopicTitle.toLowerCase().includes(title.toLowerCase())) {
          const comps = sub.competencies || (sub as any).outcomes || [];
          return comps.map((c: any) => {
            const brief = parseRawCompetency(typeof c === 'string' ? c : String(c)).briefCompetency;
            return formatCompetencyOrOutcomeForCurriculum(brief, isOBCGrade ? 'OBC' : 'CBC');
          });
        }
      }
    }
  }
  return [fallbackLabel];
}

/**
 * Intelligently converts a raw competency statement or subtopic into an authentic CBC Expected Standard statement
 * if no explicit expected standard is present in the syllabus.
 */
export function deriveExpectedStandardFromCompetency(comp: string): string {
  if (!comp) return '';
  const parsed = parseRawCompetency(comp);
  if (parsed.expectedStandard) return parsed.expectedStandard;

  let text = parsed.briefCompetency.trim();
  // Strip code prefix like "4.4.1.1 " or "1.1 " or bullet points
  text = text.replace(/^[\d\.\s\-–—]+/, '').trim();
  if (!text) return '';

  const verbMap: [RegExp, (match: RegExpMatchArray) => string][] = [
    [/^classify\s+(.*)/i, m => `${capitalize(m[1])} classified correctly`],
    [/^evaluate\s+(.*)/i, m => `${capitalize(m[1])} evaluated appropriately`],
    [/^explain\s+(.*)/i, m => `${capitalize(m[1])} explained clearly`],
    [/^describe\s+(.*)/i, m => `${capitalize(m[1])} described accurately`],
    [/^demonstrate\s+understanding\s+of\s+(.*)/i, m => `Understanding of ${m[1]} demonstrated appropriately`],
    [/^demonstrate\s+(.*)/i, m => `${capitalize(m[1])} demonstrated effectively`],
    [/^analyse\s+(.*)/i, m => `${capitalize(m[1])} analysed accordingly`],
    [/^analyze\s+(.*)/i, m => `${capitalize(m[1])} analyzed accordingly`],
    [/^explore\s+(.*)/i, m => `${capitalize(m[1])} explored appropriately`],
    [/^grow\s+(.*)/i, m => `${capitalize(m[1])} grown successfully`],
    [/^manage\s+(.*)/i, m => `${capitalize(m[1])} managed correctly`],
    [/^design\s+(.*)/i, m => `${capitalize(m[1])} designed appropriately`],
    [/^utilise\s+(.*)/i, m => `${capitalize(m[1])} utilised effectively`],
    [/^utilize\s+(.*)/i, m => `${capitalize(m[1])} utilized effectively`],
    [/^measure\s+(.*)/i, m => `${capitalize(m[1])} measured accurately`],
    [/^categorise\s+(.*)/i, m => `${capitalize(m[1])} categorised correctly`],
    [/^categorize\s+(.*)/i, m => `${capitalize(m[1])} categorized correctly`],
    [/^apply\s+(.*)/i, m => `${capitalize(m[1])} applied appropriately`],
    [/^examine\s+(.*)/i, m => `${capitalize(m[1])} examined thoroughly`],
    [/^investigate\s+(.*)/i, m => `${capitalize(m[1])} investigated appropriately`],
    [/^construct\s+(.*)/i, m => `${capitalize(m[1])} constructed accurately`],
    [/^plan\s+(.*)/i, m => `${capitalize(m[1])} planned effectively`],
    [/^state\s+(.*)/i, m => `${capitalize(m[1])} stated clearly`],
    [/^identify\s+(.*)/i, m => `${capitalize(m[1])} identified accurately`],
    [/^practise\s+(.*)/i, m => `${capitalize(m[1])} practised appropriately`],
    [/^practice\s+(.*)/i, m => `${capitalize(m[1])} practiced appropriately`],
    [/^show\s+the\s+ability\s+to\s+(.*)/i, m => `Ability to ${m[1]} demonstrated effectively`],
    [/^show\s+(.*)/i, m => `${capitalize(m[1])} shown effectively`],
    [/^solve\s+(.*)/i, m => `${capitalize(m[1])} solved accurately`],
    [/^discuss\s+(.*)/i, m => `${capitalize(m[1])} discussed constructively`],
    [/^conduct\s+(.*)/i, m => `${capitalize(m[1])} conducted safely and accurately`],
    [/^outline\s+(.*)/i, m => `${capitalize(m[1])} outlined clearly`],
    [/^distinguish\s+(.*)/i, m => `${capitalize(m[1])} distinguished accurately`],
    [/^determine\s+(.*)/i, m => `${capitalize(m[1])} determined precisely`],
    [/^prepare\s+(.*)/i, m => `${capitalize(m[1])} prepared appropriately`],
    [/^use\s+(.*)/i, m => `${capitalize(m[1])} used correctly and effectively`],
    [/^read\s+(.*)/i, m => `${capitalize(m[1])} read fluently with comprehension`],
    [/^write\s+(.*)/i, m => `${capitalize(m[1])} written legibly and correctly`],
  ];

  for (const [pattern, formatter] of verbMap) {
    const match = text.match(pattern);
    if (match) {
      let res = formatter(match).trim();
      res = res.replace(/[\.,;:]+$/, '');
      return res;
    }
  }

  // General fallback
  const cleaned = text.replace(/[\.,;:]+$/, '');
  return `Learners demonstrate competence in ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)} according to syllabus standards`;
}

/**
 * Derives rich, authentic Zambian OBC Knowledge content from a specific outcome, subtopic, or topic.
 */
export function deriveKnowledgeFromOutcome(outcome?: string, subtopicTitle?: string, topicTitle?: string): string {
  if (outcome) {
    const parsed = parseRawCompetency(outcome);
    if (parsed.knowledge && parsed.knowledge.trim().length > 3 && !/^n\/?a$/i.test(parsed.knowledge.trim())) {
      return parsed.knowledge.trim();
    }
  }

  // Strip leading numbering, bullets, and action verbs to get the true topic/concept noun
  let cleanText = (outcome || subtopicTitle || topicTitle || '')
    .replace(/^[\d\.\s\-–—:]+/, '')
    .replace(/^[•\*\-\s]+/, '')
    .replace(/^(?:identify|classify|describe|demonstrate|explain|investigate|explore|evaluate|analyse|analyze|state|list|define|solve|calculate|measure|draw|distinguish|recognise|recognize|show\s+the\s+ability\s+to|practise|practice|mention|name|observe)\s+/i, '')
    .trim();

  if (!cleanText) {
    cleanText = (subtopicTitle || topicTitle || 'Core curriculum topic').replace(/^[\d\.\s\-–—:]+/, '').trim();
  }

  const lower = cleanText.toLowerCase();

  // 1. Characteristics of living organisms / Life processes (MRS GREN)
  if (lower.includes('characteristic') && (lower.includes('living') || lower.includes('organism') || lower.includes('life'))) {
    return 'Characteristics of living organisms (Movement, Respiration, Sensitivity, Growth, Reproduction, Excretion, Nutrition - MRS GREN); distinguishing features between living organisms and non-living things.';
  }

  // 2. Invertebrates & Classification of Animals
  if (lower.includes('invertebrate') || (lower.includes('animal') && lower.includes('classif'))) {
    return 'Classification of invertebrates (insects, arachnids, molluscs, crustaceans, annelids/worms); external features, body segments, and life cycles; economic and ecological importance in Zambia (pollinators, food source, vectors).';
  }

  // 3. Pests & Parasites
  if (lower.includes('pest') || lower.includes('parasite')) {
    return 'Common crop and livestock pests and parasites in Zambia; modes of infestation; economic and agricultural damage; control methods (biological, chemical, cultural, physical); integrated pest management.';
  }

  // 4. Plants / Flowering & Non-Flowering / Photosynthesis
  if (lower.includes('plant') && (lower.includes('classif') || lower.includes('flower'))) {
    return 'Classification of plants into flowering (angiosperms) and non-flowering (gymnosperms, ferns, mosses); structural characteristics (roots, stems, leaves, flowers); reproductive adaptations.';
  }
  if (lower.includes('photosynthesis')) {
    return 'Process of photosynthesis; word and chemical equations; role of sunlight, chlorophyll, carbon dioxide, and water; storage of starch; conditions necessary for photosynthesis in green plants.';
  }

  // 5. Cells & Cell structure
  if (lower.includes('cell')) {
    return 'Cell structures (cell wall, cell membrane, cytoplasm, nucleus, vacuole, chloroplasts, mitochondria); functions of cell organelles; differences between plant and animal cells; cell specialization.';
  }

  // 6. Human Body Systems (Digestion, Respiration, Circulation, Excretion, Reproduction)
  if (lower.includes('digest')) {
    return 'Alimentary canal organs; mechanical and chemical digestion; functions of digestive enzymes; absorption of nutrients in the small intestine; assimilation and egestion.';
  }
  if (lower.includes('respirat') || lower.includes('breath') || lower.includes('gaseous exchange')) {
    return 'Gaseous exchange in humans; structure and function of the respiratory system (trachea, bronchi, alveoli); aerobic vs anaerobic respiration; inhalation and exhalation mechanisms.';
  }
  if (lower.includes('circulat') || lower.includes('heart') || lower.includes('blood')) {
    return 'Circulatory system components (heart, blood vessels: arteries, veins, capillaries, blood: red cells, white cells, platelets, plasma); double circulation; cardiovascular health.';
  }
  if (lower.includes('excret') || lower.includes('kidney')) {
    return 'Excretory organs in humans (kidneys, lungs, skin); structure and functioning of the urinary system and nephrons; formation of urine; osmoregulation and kidney hygiene.';
  }
  if (lower.includes('reproduct') && (lower.includes('human') || lower.includes('animal'))) {
    return 'Male and female reproductive systems; secondary sexual characteristics; fertilization; pregnancy and prenatal care; prevention of STIs and HIV.';
  }

  // 7. Health, Nutrition & Diseases (Waterborne, Airborne, Foodborne, Balanced Diet)
  if (lower.includes('diet') || lower.includes('nutrition') || lower.includes('food')) {
    return 'Nutrient groups (carbohydrates, proteins, fats, vitamins, minerals, water, dietary fibre); sources and bodily functions; balanced meals; deficiency diseases (kwashiorkor, marasmus, scurvy, rickets).';
  }
  if (lower.includes('disease') || lower.includes('health') || lower.includes('hygiene') || lower.includes('pathogen')) {
    return 'Causes, symptoms, and transmission of common communicable diseases (airborne: tuberculosis/influenza, waterborne: cholera/dysentery/typhoid, vector-borne: malaria); prevention and sanitation measures.';
  }
  if (lower.includes('water') && (lower.includes('safe') || lower.includes('clean') || lower.includes('source') || lower.includes('purif'))) {
    return 'Sources of water in the environment; characteristics of clean and safe water; methods of water purification (boiling, chlorination, filtration); prevention of waterborne contamination.';
  }

  // 8. Soils & Environment / Ecosystems
  if (lower.includes('soil')) {
    return 'Composition of soil (mineral particles, organic matter/humus, water, air); soil profiles (topsoil, subsoil, parent rock); comparison of soil types (sand, clay, loam); soil fertility and conservation.';
  }
  if (lower.includes('environment') || lower.includes('ecosystem') || lower.includes('habitat') || lower.includes('waste')) {
    return 'Ecosystem components (biotic and abiotic factors); food chains and food webs; energy flow; waste management (reduce, reuse, recycle); environmental conservation and sustainability in Zambia.';
  }

  // 9. Materials, Matter & Chemistry
  if (lower.includes('matter') || lower.includes('state of matter') || lower.includes('solid') || lower.includes('liquid') || lower.includes('gas')) {
    return 'States of matter (solids, liquids, gases); kinetic particle theory; physical changes of state (melting, boiling, freezing, condensation, sublimation); diffusion and thermal expansion.';
  }
  if (lower.includes('element') || lower.includes('compound') || lower.includes('mixture')) {
    return 'Differences between elements, compounds, and mixtures; physical and chemical properties; separation techniques (filtration, evaporation, distillation, chromatography, magnetisation).';
  }
  if (lower.includes('acid') || lower.includes('base') || lower.includes('salt') || lower.includes('ph')) {
    return 'Properties of acids and bases; natural and laboratory indicators; pH scale; neutralization reactions; preparation and everyday uses of common salts.';
  }

  // 10. Energy, Forces & Physics
  if (lower.includes('force') || lower.includes('motion') || lower.includes('speed') || lower.includes('friction') || lower.includes('gravity')) {
    return 'Types of forces (gravitational, frictional, magnetic, electrostatic, tension); effects of forces on motion and shape; balanced and unbalanced forces; calculations of speed and force.';
  }
  if (lower.includes('energy') || lower.includes('work') || lower.includes('power')) {
    return 'Forms of energy (kinetic, potential, thermal, electrical, chemical, light, sound); law of conservation of energy; energy transformations; renewable and non-renewable energy resources.';
  }
  if (lower.includes('light') || lower.includes('reflection') || lower.includes('refraction')) {
    return 'Properties of light; rectilinear propagation; reflection on plane mirrors; refraction through lenses and prisms; formation of shadows and eclipses.';
  }
  if (lower.includes('sound')) {
    return 'Production and transmission of sound; pitch, frequency, and loudness; speed of sound through different media; echo and echo prevention; auditory hygiene.';
  }
  if (lower.includes('electric') || lower.includes('circuit') || lower.includes('current')) {
    return 'Simple electrical circuits; circuit components (cells, bulbs, switches, connecting wires); conductors and insulators; series and parallel circuits; safe usage of electricity.';
  }
  if (lower.includes('magnet')) {
    return 'Properties of magnets (poles, attraction, repulsion); magnetic and non-magnetic materials; magnetic fields; methods of magnetisation and demagnetisation; practical uses.';
  }

  // 11. Mathematics Concepts
  if (lower.includes('fraction')) {
    return 'Types of fractions (proper, improper, mixed numbers); equivalent fractions; four basic arithmetic operations (addition, subtraction, multiplication, division); practical word problem applications.';
  }
  if (lower.includes('decimal')) {
    return 'Place value of decimals up to 3 or 4 decimal places; conversion between fractions and decimals; addition, subtraction, multiplication, and division of decimal quantities.';
  }
  if (lower.includes('percent')) {
    return 'Concept of percentage as parts per hundred; conversion between percentages, fractions, and decimals; calculating percentages of quantities; profit, loss, and discount.';
  }
  if (lower.includes('integer') || lower.includes('negative number')) {
    return 'Positive and negative integers; representation and ordering on number lines; rules of signs for addition, subtraction, multiplication, and division of integers.';
  }
  if (lower.includes('ratio') || lower.includes('proportion')) {
    return 'Expressing and simplifying ratios; dividing amounts in given ratios; direct and inverse proportion; practical problem solving involving rates, scale, and exchange.';
  }
  if (lower.includes('shape') || lower.includes('geometr') || lower.includes('angle') || lower.includes('polygon') || lower.includes('perimeter') || lower.includes('area')) {
    return 'Properties of 2D and 3D shapes; angle types and angle sums; formulas and calculations for perimeter, area, surface area, and volume; spatial reasoning.';
  }
  if (lower.includes('algebra') || lower.includes('equation')) {
    return 'Algebraic terms and expressions; substituting values; simplifying by collecting like terms; solving linear equations in one unknown; word problem translations.';
  }

  // 12. Social Studies / Geography / Civics / History
  if (lower.includes('map') || lower.includes('cardinal') || lower.includes('direction') || lower.includes('grid')) {
    return 'Map reading skills; cardinal points and bearings; conventional map symbols and key; scale and distance calculation; locating features using grid coordinates.';
  }
  if (lower.includes('weather') || lower.includes('climate')) {
    return 'Elements of weather (temperature, rainfall, wind direction/speed, atmospheric pressure, humidity); weather recording instruments; seasons and climatic factors in Zambia.';
  }
  if (lower.includes('transport') || lower.includes('communication')) {
    return 'Modes of transport (road, rail, water, air); traditional and modern communication media (print, telecommunications, digital); economic benefits; transport safety and infrastructure in Zambia.';
  }
  if (lower.includes('government') || lower.includes('citizen') || lower.includes('leader') || lower.includes('civic') || lower.includes('constitution')) {
    return 'Organs of government (Executive, Legislature, Judiciary); rights, duties, and responsibilities of citizens; democratic values, good governance, and rule of law in Zambia.';
  }

  // 13. Languages (English / Zambian Languages)
  if (lower.includes('read') || lower.includes('comprehension')) {
    return 'Reading comprehension strategies; literal and inferential comprehension; vocabulary in context; identifying main ideas and supporting details; summarizing texts.';
  }
  if (lower.includes('writ') || lower.includes('composition') || lower.includes('letter')) {
    return 'Writing process (planning, drafting, revising, editing); narrative, descriptive, and functional writing formats; paragraph structuring and transition markers.';
  }
  if (lower.includes('gramm') || lower.includes('tense') || lower.includes('noun') || lower.includes('verb') || lower.includes('preposition') || lower.includes('conjunction')) {
    return 'Grammatical rules and word classes; correct usage of verb tenses (past, present, continuous, perfect); subject-verb agreement; punctuation and sentence construction.';
  }

  // Default clean noun-based knowledge formulation
  const capitalizedNoun = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
  return `Core factual principles, structural features, definitions, classifications, and practical syllabus applications of ${capitalizedNoun}.`;
}

/**
 * Derives authentic Zambian OBC Skills from a specific outcome, subtopic, or topic.
 */
export function deriveSkillsFromOutcome(outcome?: string, subtopicTitle?: string, topicTitle?: string): string {
  if (outcome) {
    const parsed = parseRawCompetency(outcome);
    if (parsed.skills && parsed.skills.trim().length > 3 && !/^n\/?a$/i.test(parsed.skills.trim())) {
      return parsed.skills.trim();
    }
  }

  const clean = (outcome || subtopicTitle || topicTitle || '').toLowerCase();

  if (clean.includes('fraction') || clean.includes('number') || clean.includes('algebra') || clean.includes('calculate') || clean.includes('solve') || clean.includes('comput') || clean.includes('measure') || clean.includes('graph') || clean.includes('geometry') || clean.includes('ratio')) {
    return 'Computation, logical deduction, mathematical calculation, data interpretation, problem-solving, and accuracy.';
  }
  if (clean.includes('experiment') || clean.includes('investigat') || clean.includes('observ') || clean.includes('apparatus') || clean.includes('microscope') || clean.includes('specimen') || clean.includes('chem') || clean.includes('physic') || clean.includes('biolog') || clean.includes('science') || clean.includes('plant') || clean.includes('animal') || clean.includes('cell')) {
    return 'Observation, manipulation of apparatus, recording scientific data, classification, identification, formulation of hypotheses, and reporting findings.';
  }
  if (clean.includes('read') || clean.includes('write') || clean.includes('speak') || clean.includes('listen') || clean.includes('oral') || clean.includes('story') || clean.includes('pronunc') || clean.includes('gramm') || clean.includes('english') || clean.includes('literacy')) {
    return 'Active listening, fluent articulation, reading comprehension, legible and coherent writing, vocabulary expression, and grammatical analysis.';
  }
  if (clean.includes('map') || clean.includes('chart') || clean.includes('draw') || clean.includes('construct') || clean.includes('model') || clean.includes('design') || clean.includes('diagram')) {
    return 'Drawing, design construction, spatial representation, pattern mapping, tool handling, and creative application.';
  }
  if (clean.includes('soil') || clean.includes('environment') || clean.includes('weather') || clean.includes('climate') || clean.includes('water') || clean.includes('pest')) {
    return 'Observation, sample collection, comparison, environmental surveying, data recording, and practical demonstration.';
  }

  return 'Identification, classification, observation, demonstration, critical thinking, practical application, and effective communication.';
}

/**
 * Derives authentic Zambian OBC Values from a specific outcome, subtopic, or topic.
 */
export function deriveValuesFromOutcome(outcome?: string, subtopicTitle?: string, topicTitle?: string): string {
  if (outcome) {
    const parsed = parseRawCompetency(outcome);
    if (parsed.values && parsed.values.trim().length > 3 && !/^n\/?a$/i.test(parsed.values.trim())) {
      return parsed.values.trim();
    }
  }

  const clean = (outcome || subtopicTitle || topicTitle || '').toLowerCase();

  if (clean.includes('plant') || clean.includes('animal') || clean.includes('environment') || clean.includes('living') || clean.includes('soil') || clean.includes('nature') || clean.includes('water') || clean.includes('ecology')) {
    return 'Appreciation of biodiversity, environmental stewardship, care for living things, curiosity, and conservation awareness.';
  }
  if (clean.includes('health') || clean.includes('disease') || clean.includes('hygiene') || clean.includes('food') || clean.includes('diet') || clean.includes('safety')) {
    return 'Personal and community hygiene, responsibility for healthy living, safety consciousness, empathy, and cooperation.';
  }
  if (clean.includes('math') || clean.includes('number') || clean.includes('calculate') || clean.includes('fraction') || clean.includes('algebra') || clean.includes('measure') || clean.includes('money')) {
    return 'Accuracy, intellectual honesty, perseverance in problem-solving, logical reasoning, and precision.';
  }
  if (clean.includes('government') || clean.includes('citizen') || clean.includes('culture') || clean.includes('communit') || clean.includes('social') || clean.includes('leader')) {
    return 'Civic responsibility, respect for human rights, patriotism, cultural tolerance, peace, and national unity.';
  }
  if (clean.includes('read') || clean.includes('write') || clean.includes('english') || clean.includes('language') || clean.includes('literacy')) {
    return 'Appreciation of literature, self-expression, active listening, respect for opinions of others, and confidence.';
  }

  return 'Appreciation, curiosity, accuracy, cooperation, responsibility, critical inquiry, and safety awareness.';
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getExpectedStandardsForSubtopic(topicTitle: string, subtopicTitle: string, _competencyTitle?: string, grade?: string, subject?: string): string {
  if (!grade || !subject) {
    if (_competencyTitle) return deriveExpectedStandardFromCompetency(_competencyTitle);
    if (subtopicTitle) return deriveExpectedStandardFromCompetency(subtopicTitle);
    return 'Learners demonstrate mastery of topic skills.';
  }

  const rawSyllabi = SYLLABI[grade]?.[subject] || SYLLABI[grade]?.[subject.toLowerCase()] || [];
  for (const topic of rawSyllabi) {
    if (topic.title.toLowerCase().includes(topicTitle.toLowerCase()) || topicTitle.toLowerCase().includes(topic.title.toLowerCase())) {
      for (const sub of (topic.subtopics || [])) {
        const title = sub.title || (sub as any).name || '';
        if (title.toLowerCase().includes(subtopicTitle.toLowerCase()) || subtopicTitle.toLowerCase().includes(title.toLowerCase())) {
          const exp = sub.expectedStandard || (sub as any).expectedStandards;
          if (exp) {
            return Array.isArray(exp) ? exp.join('; ') : String(exp);
          }
          if (sub.competencies && sub.competencies.length > 0) {
            const derived = sub.competencies.map((c: any) => deriveExpectedStandardFromCompetency(typeof c === 'string' ? c : String(c)));
            return derived.join('; ');
          }
        }
      }
    }
  }

  if (_competencyTitle) return deriveExpectedStandardFromCompetency(_competencyTitle);
  if (subtopicTitle) return deriveExpectedStandardFromCompetency(subtopicTitle);
  return 'Learners demonstrate mastery of topic skills accurately according to syllabus standards.';
}

export function deriveLearningActivitiesFromCompetency(comp?: string, subtopicTitle?: string, topicTitle?: string): string[] {
  const parsed = comp ? parseRawCompetency(comp) : null;
  if (parsed && parsed.learningActivities && parsed.learningActivities.length > 0) {
    return parsed.learningActivities;
  }
  
  // Return empty array if no explicit activities are mapped to the competency.
  return [];
}

export function partitionActivitiesByCompetencies(
  activities: string[],
  competencies: string[],
  targetComp: string
): string[] {
  if (!activities || activities.length === 0) return [];
  if (!competencies || competencies.length <= 1) return activities;

  // 1. Identify which competency index in competencies targetComp corresponds to
  const briefTarget = parseRawCompetency(targetComp).briefCompetency || targetComp;
  const cleanTarget = briefTarget
    .toLowerCase()
    .replace(/^(specific\s*(competency|competencies|outcome|outcomes):\s*)/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  const codeTargetMatch = targetComp.match(/\b(\d+(?:\.\d+)+)\b/);
  const codeTarget = codeTargetMatch ? codeTargetMatch[1] : '';

  let targetIdx = competencies.findIndex(c => {
    const cStr = typeof c === 'string' ? c : String(c);
    const cCodeMatch = cStr.match(/\b(\d+(?:\.\d+)+)\b/);
    if (codeTarget && cCodeMatch && codeTarget === cCodeMatch[1]) {
      return true;
    }
    const cBrief = parseRawCompetency(cStr).briefCompetency || cStr;
    const cClean = cBrief
      .toLowerCase()
      .replace(/^(specific\s*(competency|competencies|outcome|outcomes):\s*)/i, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
    return cClean && (cClean === cleanTarget || cClean.includes(cleanTarget) || cleanTarget.includes(cClean));
  });

  if (targetIdx === -1) {
    const targetWords = briefTarget.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
    targetIdx = competencies.findIndex(c => {
      const cClean = (typeof c === 'string' ? c : String(c)).toLowerCase();
      return targetWords.length > 0 && targetWords.some(w => cClean.includes(w));
    });
  }

  if (targetIdx === -1) {
    return [];
  }

  // Check if target competency has embedded activities
  const targetCompStr = competencies[targetIdx];
  if (targetCompStr) {
    const parsedTarget = parseRawCompetency(targetCompStr);
    if (parsedTarget.learningActivities && parsedTarget.learningActivities.length > 0) {
      return parsedTarget.learningActivities;
    }
  }

  const STOPWORDS = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were',
    'use', 'using', 'used', 'ways', 'variety', 'show', 'showing', 'different',
    'appropriately', 'correctly', 'accordingly', 'life', 'daily', 'context',
    'contexts', 'demonstrate', 'demonstrating', 'apply', 'applying', 'explore',
    'exploring', 'exhibit', 'exhibiting', 'investigate', 'investigating',
    'analyse', 'analysing', 'analyze', 'analyzing', 'prevent', 'preventing',
    'identify', 'identifying', 'things', 'such'
  ]);

  const totalComps = competencies.length;
  const totalActs = activities.length;

  const compWordSets: string[][] = competencies.map(c => {
    const brief = parseRawCompetency(typeof c === 'string' ? c : String(c)).briefCompetency || String(c);
    const baseWords = brief
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !STOPWORDS.has(w));
    return baseWords;
  });

  // Unique keywords per competency (words not shared across multiple competencies)
  const uniqueCompWordSets: string[][] = compWordSets.map((words, idx) => {
    const otherWords = new Set<string>();
    compWordSets.forEach((ow, oIdx) => {
      if (oIdx !== idx) {
        ow.forEach(w => otherWords.add(w));
      }
    });
    return words.filter(w => !otherWords.has(w));
  });

  // Calculate proportional slice for monotonic syllabus progression
  const startIdx = Math.floor((targetIdx / totalComps) * totalActs);
  const endIdx = targetIdx === totalComps - 1 ? totalActs : Math.floor(((targetIdx + 1) / totalComps) * totalActs);
  const sliceActs = activities.slice(startIdx, Math.max(startIdx + 1, endIdx));

  // Find activities matching unique keywords for this competency
  const myUniqueWords = uniqueCompWordSets[targetIdx] || [];
  const matchedActs = activities.filter(act => {
    const aLower = act.toLowerCase();
    return myUniqueWords.some(w => aLower.includes(w));
  });

  // Gather other competencies' unique keywords to strictly forbid leaking
  const otherUniqueWords = new Set<string>();
  uniqueCompWordSets.forEach((uw, idx) => {
    if (idx !== targetIdx) {
      uw.forEach(w => otherUniqueWords.add(w));
    }
  });

  const combined = Array.from(new Set([...matchedActs, ...sliceActs]));
  // Exclude activities that strictly belong to another competency
  const strictlyFiltered = combined.filter(act => {
    const aLower = act.toLowerCase();
    const matchesOther = Array.from(otherUniqueWords).some(ow => aLower.includes(ow));
    const matchesMine = myUniqueWords.some(mw => aLower.includes(mw));
    if (matchesOther && !matchesMine) return false;
    return true;
  });

  if (strictlyFiltered.length > 0 && strictlyFiltered.length < totalActs) {
    return strictlyFiltered;
  }

  return sliceActs.length > 0 ? sliceActs : [activities[Math.min(targetIdx, totalActs - 1)]];
}

export function getActivitiesForSubtopic(topicTitle: string, subtopicTitle: string, _competencyTitle?: string, grade?: string, subject?: string): string[] {
  // If specific competency is selected and has embedded learning activities, return them immediately
  if (_competencyTitle) {
    const parsedComp = parseRawCompetency(_competencyTitle);
    if (parsedComp.learningActivities && parsedComp.learningActivities.length > 0) {
      return parsedComp.learningActivities;
    }
  }

  if (!grade || !subject) {
    if (_competencyTitle) return deriveLearningActivitiesFromCompetency(_competencyTitle, subtopicTitle, topicTitle);
    if (subtopicTitle) return deriveLearningActivitiesFromCompetency(subtopicTitle, subtopicTitle, topicTitle);
    return [];
  }

  const rawSyllabi = SYLLABI[grade]?.[subject] || SYLLABI[grade]?.[subject.toLowerCase()] || [];
  for (const topic of rawSyllabi) {
    if (topic.title.toLowerCase().includes(topicTitle.toLowerCase()) || topicTitle.toLowerCase().includes(topic.title.toLowerCase())) {
      for (const sub of (topic.subtopics || [])) {
        const title = sub.title || (sub as any).name || '';
        if (title.toLowerCase().includes(subtopicTitle.toLowerCase()) || subtopicTitle.toLowerCase().includes(title.toLowerCase())) {
          const comps: string[] = sub.competencies || (sub as any).outcomes || [];
          
          // 1. If learningActivities property exists on subtopic
          if (sub.learningActivities) {
            if (typeof sub.learningActivities === 'object' && !Array.isArray(sub.learningActivities)) {
              if (_competencyTitle) {
                const compCode = (_competencyTitle.match(/\b(\d+(?:\.\d+)+)\b/) || [])[1];
                const matchedKey = Object.keys(sub.learningActivities).find(k => {
                  const kCode = (k.match(/\b(\d+(?:\.\d+)+)\b/) || [])[1];
                  if (compCode && kCode && compCode === kCode) return true;
                  return _competencyTitle.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(_competencyTitle.toLowerCase());
                });
                if (matchedKey && Array.isArray((sub.learningActivities as any)[matchedKey])) {
                  return (sub.learningActivities as any)[matchedKey];
                }
              } else {
                return Object.values(sub.learningActivities).flat() as string[];
              }
            } else if (Array.isArray(sub.learningActivities) && sub.learningActivities.length > 0) {
              if (_competencyTitle && comps.length > 1) {
                const partitioned = partitionActivitiesByCompetencies(sub.learningActivities, comps, _competencyTitle);
                if (partitioned.length > 0) return partitioned;
              }
              if (_competencyTitle && comps.length === 1) {
                return sub.learningActivities;
              }
              if (!_competencyTitle) {
                return sub.learningActivities;
              }
            }
          }

          // 2. Check embedded learning activities in competencies
          if (comps.length > 0) {
            if (_competencyTitle) {
              const compCode = (_competencyTitle.match(/\b(\d+(?:\.\d+)+)\b/) || [])[1];
              const briefComp = parseRawCompetency(_competencyTitle).briefCompetency || _competencyTitle;
              const cleanComp = briefComp.toLowerCase().replace(/[^a-z0-9]/g, '');

              const matched = comps.find((c: any) => {
                const cStr = typeof c === 'string' ? c : String(c);
                const cCode = (cStr.match(/\b(\d+(?:\.\d+)+)\b/) || [])[1];
                if (compCode && cCode && compCode === cCode) return true;
                const cBrief = parseRawCompetency(cStr).briefCompetency || cStr;
                const cClean = cBrief.toLowerCase().replace(/[^a-z0-9]/g, '');
                return cleanComp && (cleanComp === cClean || cleanComp.includes(cClean) || cClean.includes(cleanComp));
              });

              if (matched) {
                const embedded = extractEmbeddedLearningActivities([matched]);
                if (embedded.length > 0) return embedded;
              }
            } else {
              const embedded = extractEmbeddedLearningActivities(comps);
              if (embedded.length > 0) return embedded;
            }
          }
        }
      }
    }
  }

  if (_competencyTitle) return deriveLearningActivitiesFromCompetency(_competencyTitle, subtopicTitle, topicTitle);
  return [];
}
