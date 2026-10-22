import { safeLocalStorage } from './storage';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface EducationalDiagram {
  id: string;
  title: string;
  category: 'animals' | 'fruits_foods' | 'household' | 'transport' | 'science' | 'math' | 'general';
  section: 'Section A (MCQ)' | 'Section B (Short Answer)' | 'Section C (Essay)' | 'Section D (Matching)' | 'General' | 'Lesson Plan';
  syllabusSubject: string;
  grade: string;
  topic: string;
  subtopic: string;
  svgContent: string;
  tags: string[];
  createdAt: string;
  userEmail?: string;
  syncedToAccount: boolean;
}

const LOCAL_STORAGE_KEY = 'fortunes_saved_assessment_diagrams';

// Extensive pre-seeded real objective teaching diagrams grouped by Topic & Subtopic (Pinterest Education Style)
export const SEEDED_EDUCATIONAL_DIAGRAMS: Omit<EducationalDiagram, 'id' | 'createdAt' | 'syncedToAccount'>[] = [
  // 1. PLANTS & BOTANY
  {
    title: 'Parts of a Flowering Plant Diagram',
    category: 'science',
    section: 'General',
    syllabusSubject: 'Integrated Science',
    grade: 'Grade 5',
    topic: 'Plants & Living Organisms',
    subtopic: 'Parts of a Flowering Plant',
    tags: ['plant', 'flower', 'stem', 'roots', 'leaves', 'botany'],
    svgContent: `<svg viewBox="0 0 400 240" width="100%" height="160" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; padding:8px;">
      <rect x="0" y="190" width="400" height="50" fill="#78350f" opacity="0.15"/>
      <line x1="0" y1="190" x2="400" y2="190" stroke="#78350f" stroke-width="2" stroke-dasharray="4,4"/>
      <path d="M 200 190 Q 180 205 160 230 M 200 190 Q 220 205 240 235 M 200 190 Q 195 215 190 238" stroke="#92400e" stroke-width="3" fill="none"/>
      <path d="M 200 190 L 200 80" stroke="#16a34a" stroke-width="7" stroke-linecap="round"/>
      <path d="M 200 140 Q 140 125 130 140 Q 160 155 200 145" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
      <path d="M 200 110 Q 260 95 270 110 Q 240 125 200 115" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
      <circle cx="200" cy="55" r="15" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
      <circle cx="175" cy="55" r="13" fill="#ef4444" opacity="0.9"/>
      <circle cx="225" cy="55" r="13" fill="#ef4444" opacity="0.9"/>
      <circle cx="200" cy="30" r="13" fill="#ef4444" opacity="0.9"/>
      <circle cx="200" cy="80" r="13" fill="#ef4444" opacity="0.9"/>
      <text x="275" y="45" font-family="sans-serif" font-size="11" font-weight="bold" fill="#b91c1c">1. Petal / Flower</text>
      <line x1="220" y1="45" x2="270" y2="45" stroke="#b91c1c" stroke-width="1.5" stroke-dasharray="2,2"/>
      <text x="280" y="110" font-family="sans-serif" font-size="11" font-weight="bold" fill="#15803d">2. Leaf</text>
      <line x1="250" y1="110" x2="275" y2="110" stroke="#15803d" stroke-width="1.5" stroke-dasharray="2,2"/>
      <text x="35" y="145" font-family="sans-serif" font-size="11" font-weight="bold" fill="#166534">3. Stem</text>
      <line x1="80" y1="145" x2="195" y2="145" stroke="#166534" stroke-width="1.5" stroke-dasharray="2,2"/>
      <text x="35" y="215" font-family="sans-serif" font-size="11" font-weight="bold" fill="#78350f">4. Roots</text>
      <line x1="80" y1="215" x2="175" y2="215" stroke="#78350f" stroke-width="1.5" stroke-dasharray="2,2"/>
    </svg>`
  },
  {
    title: 'Photosynthesis Process & Solar Energy Absorption',
    category: 'science',
    section: 'Section B (Short Answer)',
    syllabusSubject: 'Integrated Science',
    grade: 'Grade 6',
    topic: 'Plants & Living Organisms',
    subtopic: 'Photosynthesis & Plant Feeding',
    tags: ['photosynthesis', 'sunlight', 'leaf', 'carbon dioxide', 'oxygen', 'chlorophyll'],
    svgContent: `<svg viewBox="0 0 400 200" width="100%" height="160" xmlns="http://www.w3.org/2000/svg" style="background:#f0fdf4; border-radius:12px; border:1px solid #bbf7d0; padding:8px;">
      <!-- Sun -->
      <circle cx="50" cy="40" r="22" fill="#facc15" stroke="#eab308" stroke-width="2"/>
      <text x="50" y="80" font-size="10" font-weight="bold" fill="#a16207" text-anchor="middle">Sunlight Energy</text>
      <path d="M 70 50 Q 120 70 150 90" stroke="#eab308" stroke-width="2" stroke-dasharray="4,2" fill="none" marker-end="url(#arrow)"/>
      <!-- Leaf -->
      <path d="M 160 120 Q 250 40 330 110 Q 250 180 160 120 Z" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
      <path d="M 160 120 L 320 110" stroke="#15803d" stroke-width="2"/>
      <!-- Inputs & Outputs -->
      <text x="130" y="165" font-size="10" font-weight="bold" fill="#1e3a8a">CO₂ (Carbon Dioxide) In</text>
      <text x="270" y="165" font-size="10" font-weight="bold" fill="#dc2626">O₂ (Oxygen) Out</text>
      <text x="230" y="70" font-size="11" font-weight="bold" fill="#15803d">Chlorophyll in Leaf</text>
    </svg>`
  },

  // 2. ANIMALS & CLASSIFICATION
  {
    title: 'Domestic Animals & Farm Products',
    category: 'animals',
    section: 'Section A (MCQ)',
    syllabusSubject: 'Integrated Science / Social Studies',
    grade: 'Grade 3',
    topic: 'Animals & Food Sources',
    subtopic: 'Domestic Livestock & Classification',
    tags: ['animal', 'cow', 'sheep', 'chicken', 'domestic', 'livestock'],
    svgContent: `<svg viewBox="0 0 400 180" width="100%" height="160" xmlns="http://www.w3.org/2000/svg" style="background:#f0fdf4; border-radius:12px; border:1px solid #bbf7d0; padding:8px;">
      <rect x="10" y="10" width="115" height="155" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
      <text x="67" y="32" text-anchor="middle" font-size="28">🐄</text>
      <text x="67" y="55" text-anchor="middle" font-weight="bold" font-size="12" fill="#0f172a">COW</text>
      <text x="67" y="75" text-anchor="middle" font-size="10" fill="#475569">Provides: Milk & Meat</text>
      <rect x="25" y="125" width="85" height="22" rx="6" fill="#00a86b"/>
      <text x="67" y="140" text-anchor="middle" font-weight="bold" font-size="10" fill="#ffffff">LIVESTOCK A</text>

      <rect x="142" y="10" width="115" height="155" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
      <text x="199" y="32" text-anchor="middle" font-size="28">🐔</text>
      <text x="199" y="55" text-anchor="middle" font-weight="bold" font-size="12" fill="#0f172a">HEN / CHICKEN</text>
      <text x="199" y="75" text-anchor="middle" font-size="10" fill="#475569">Provides: Eggs & Poultry</text>
      <rect x="157" y="125" width="85" height="22" rx="6" fill="#00a86b"/>
      <text x="199" y="140" text-anchor="middle" font-weight="bold" font-size="10" fill="#ffffff">LIVESTOCK B</text>

      <rect x="274" y="10" width="115" height="155" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
      <text x="331" y="32" text-anchor="middle" font-size="28">🐑</text>
      <text x="331" y="55" text-anchor="middle" font-weight="bold" font-size="12" fill="#0f172a">SHEEP</text>
      <text x="331" y="75" text-anchor="middle" font-size="10" fill="#475569">Provides: Wool & Mutton</text>
      <rect x="289" y="125" width="85" height="22" rx="6" fill="#00a86b"/>
      <text x="331" y="140" text-anchor="middle" font-weight="bold" font-size="10" fill="#ffffff">LIVESTOCK C</text>
    </svg>`
  },
  {
    title: 'Wild Animals & Natural Habitats',
    category: 'animals',
    section: 'Section D (Matching)',
    syllabusSubject: 'Integrated Science',
    grade: 'Grade 4',
    topic: 'Animals & Food Sources',
    subtopic: 'Wild Animals & Habitats',
    tags: ['lion', 'elephant', 'zebra', 'wildlife', 'habitat', 'savannah'],
    svgContent: `<svg viewBox="0 0 400 180" width="100%" height="160" xmlns="http://www.w3.org/2000/svg" style="background:#fff7ed; border-radius:12px; border:1px solid #fed7aa; padding:8px;">
      <g transform="translate(20,20)">
        <rect x="0" y="0" width="100" height="130" rx="8" fill="#ffffff" stroke="#fdba74"/>
        <text x="50" y="45" text-anchor="middle" font-size="34">🦁</text>
        <text x="50" y="80" text-anchor="middle" font-weight="bold" font-size="11" fill="#c2410c">Lion</text>
        <text x="50" y="102" text-anchor="middle" font-size="9" fill="#9a3412">(Carnivore)</text>
      </g>
      <g transform="translate(150,20)">
        <rect x="0" y="0" width="100" height="130" rx="8" fill="#ffffff" stroke="#fdba74"/>
        <text x="50" y="45" text-anchor="middle" font-size="34">🐘</text>
        <text x="50" y="80" text-anchor="middle" font-weight="bold" font-size="11" fill="#c2410c">Elephant</text>
        <text x="50" y="102" text-anchor="middle" font-size="9" fill="#9a3412">(Herbivore)</text>
      </g>
      <g transform="translate(280,20)">
        <rect x="0" y="0" width="100" height="130" rx="8" fill="#ffffff" stroke="#fdba74"/>
        <text x="50" y="45" text-anchor="middle" font-size="34">🦓</text>
        <text x="50" y="80" text-anchor="middle" font-weight="bold" font-size="11" fill="#c2410c">Zebra</text>
        <text x="50" y="102" text-anchor="middle" font-size="9" fill="#9a3412">(Herbivore)</text>
      </g>
    </svg>`
  },

  // 3. NUTRITION, FRUITS & FOODS
  {
    title: 'Healthy Food Pyramid & Balanced Diet',
    category: 'fruits_foods',
    section: 'Section B (Short Answer)',
    syllabusSubject: 'Home Economics / CTS',
    grade: 'Grade 4',
    topic: 'Nutrition & Healthy Eating',
    subtopic: 'Food Pyramid & Balanced Diet',
    tags: ['food', 'pyramid', 'nutrition', 'balanced diet', 'carbohydrates', 'vitamins'],
    svgContent: `<svg viewBox="0 0 400 190" width="100%" height="160" xmlns="http://www.w3.org/2000/svg" style="background:#fffbe0; border-radius:12px; border:1px solid #fef08a; padding:8px;">
      <polygon points="200,10 360,175 40,175" fill="#ffffff" stroke="#ca8a04" stroke-width="2"/>
      <line x1="140" y1="70" x2="260" y2="70" stroke="#ca8a04" stroke-width="1.5" stroke-dasharray="3,3"/>
      <line x1="90" y1="120" x2="310" y2="120" stroke="#ca8a04" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="200" y="45" text-anchor="middle" font-size="18">🧀 🧈</text>
      <text x="200" y="62" text-anchor="middle" font-size="9" font-weight="bold" fill="#854d0e">GROUP 1: FATS & OILS</text>
      <text x="200" y="95" text-anchor="middle" font-size="20">🍎 🥕 🍌 🥦 🌽</text>
      <text x="200" y="112" text-anchor="middle" font-size="9" font-weight="bold" fill="#15803d">GROUP 2: FRUITS & VEGETABLES</text>
      <text x="200" y="148" text-anchor="middle" font-size="22">🍞 🍚 🥔 🍠</text>
      <text x="200" y="165" text-anchor="middle" font-size="9" font-weight="bold" fill="#9a3412">GROUP 3: CARBOHYDRATES & STARCH</text>
    </svg>`
  },
  {
    title: 'Fresh Fruits & Vitamin Source Chart',
    category: 'fruits_foods',
    section: 'Section A (MCQ)',
    syllabusSubject: 'Integrated Science',
    grade: 'Grade 3',
    topic: 'Nutrition & Healthy Eating',
    subtopic: 'Fresh Fruits & Vitamin Sources',
    tags: ['fruit', 'apple', 'banana', 'orange', 'mango', 'vitamin c'],
    svgContent: `<svg viewBox="0 0 400 180" width="100%" height="160" xmlns="http://www.w3.org/2000/svg" style="background:#fef2f2; border-radius:12px; border:1px solid #fecaca; padding:8px;">
      <g transform="translate(15,15)">
        <rect x="0" y="0" width="80" height="140" rx="8" fill="#ffffff" stroke="#fca5a5"/>
        <text x="40" y="40" text-anchor="middle" font-size="30">🍎</text>
        <text x="40" y="75" text-anchor="middle" font-weight="bold" font-size="10" fill="#991b1b">Apple</text>
        <text x="40" y="95" text-anchor="middle" font-size="8.5" fill="#dc2626">Vitamin C</text>
      </g>
      <g transform="translate(110,15)">
        <rect x="0" y="0" width="80" height="140" rx="8" fill="#ffffff" stroke="#fca5a5"/>
        <text x="40" y="40" text-anchor="middle" font-size="30">🍌</text>
        <text x="40" y="75" text-anchor="middle" font-weight="bold" font-size="10" fill="#991b1b">Banana</text>
        <text x="40" y="95" text-anchor="middle" font-size="8.5" fill="#dc2626">Potassium</text>
      </g>
      <g transform="translate(205,15)">
        <rect x="0" y="0" width="80" height="140" rx="8" fill="#ffffff" stroke="#fca5a5"/>
        <text x="40" y="40" text-anchor="middle" font-size="30">🍊</text>
        <text x="40" y="75" text-anchor="middle" font-weight="bold" font-size="10" fill="#991b1b">Orange</text>
        <text x="40" y="95" text-anchor="middle" font-size="8.5" fill="#dc2626">Vitamin C</text>
      </g>
      <g transform="translate(300,15)">
        <rect x="0" y="0" width="80" height="140" rx="8" fill="#ffffff" stroke="#fca5a5"/>
        <text x="40" y="40" text-anchor="middle" font-size="30">🥭</text>
        <text x="40" y="75" text-anchor="middle" font-weight="bold" font-size="10" fill="#991b1b">Mango</text>
        <text x="40" y="95" text-anchor="middle" font-size="8.5" fill="#dc2626">Vitamin A</text>
      </g>
    </svg>`
  },

  // 4. HOUSEHOLD ITEMS & MEASUREMENT
  {
    title: 'Analogue Clock Time Reading',
    category: 'household',
    section: 'Section C (Essay)',
    syllabusSubject: 'Mathematics',
    grade: 'Grade 4',
    topic: 'Time & Measurement',
    subtopic: 'Analogue Clock Reading',
    tags: ['clock', 'time', 'hours', 'minutes', 'analogue'],
    svgContent: `<svg viewBox="0 0 400 180" width="100%" height="160" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; padding:8px;">
      <circle cx="120" cy="90" r="65" fill="#ffffff" stroke="#0284c7" stroke-width="4"/>
      <circle cx="120" cy="90" r="4" fill="#0284c7"/>
      <text x="120" y="38" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">12</text>
      <text x="172" y="94" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">3</text>
      <text x="120" y="148" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">6</text>
      <text x="68" y="94" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1">9</text>
      <line x1="120" y1="90" x2="95" y2="58" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
      <line x1="120" y1="90" x2="152" y2="72" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
      <text x="260" y="60" font-size="12" font-weight="bold" fill="#0f172a">Clock Reading Test</text>
      <text x="260" y="85" font-size="11" fill="#475569">Short Hour Hand = 10</text>
      <text x="260" y="105" font-size="11" fill="#475569">Long Minute Hand = 2</text>
      <rect x="255" y="125" width="120" height="28" rx="6" fill="#0284c7"/>
      <text x="315" y="143" text-anchor="middle" font-weight="bold" font-size="11" fill="#ffffff">Time = 10:10 AM</text>
    </svg>`
  },
  {
    title: 'Laboratory Glassware & Scientific Apparatus',
    category: 'science',
    section: 'Section B (Short Answer)',
    syllabusSubject: 'Integrated Science',
    grade: 'Grade 8',
    topic: 'Science Laboratory',
    subtopic: 'Common Laboratory Glassware & Apparatus',
    tags: ['beaker', 'flask', 'test tube', 'apparatus', 'science lab'],
    svgContent: `<svg viewBox="0 0 400 180" width="100%" height="160" xmlns="http://www.w3.org/2000/svg" style="background:#f0f9ff; border-radius:12px; border:1px solid #bae6fd; padding:8px;">
      <!-- Beaker -->
      <g transform="translate(30,20)">
        <path d="M 10 10 L 10 110 Q 10 120 20 120 L 70 120 Q 80 120 80 110 L 80 10" fill="none" stroke="#0284c7" stroke-width="3"/>
        <path d="M 12 70 L 78 70 L 78 115 L 12 115 Z" fill="#38bdf8" opacity="0.3"/>
        <text x="45" y="140" text-anchor="middle" font-weight="bold" font-size="10" fill="#0369a1">A. Beaker</text>
      </g>
      <!-- Erlenmeyer Flask -->
      <g transform="translate(150,20)">
        <path d="M 35 10 L 55 10 L 55 40 L 80 110 Q 85 120 70 120 L 20 120 Q 5 120 10 110 L 35 40 Z" fill="none" stroke="#0284c7" stroke-width="3"/>
        <text x="45" y="140" text-anchor="middle" font-weight="bold" font-size="10" fill="#0369a1">B. Conical Flask</text>
      </g>
      <!-- Measuring Cylinder -->
      <g transform="translate(280,20)">
        <rect x="25" y="10" width="30" height="110" rx="3" fill="none" stroke="#0284c7" stroke-width="3"/>
        <rect x="15" y="120" width="50" height="8" rx="2" fill="#0284c7"/>
        <text x="40" y="140" text-anchor="middle" font-weight="bold" font-size="10" fill="#0369a1">C. Measuring Cylinder</text>
      </g>
    </svg>`
  },

  // 5. TRANSPORT & VEHICLES
  {
    title: 'Modes of Transport (Land, Water & Air)',
    category: 'transport',
    section: 'Section D (Matching)',
    syllabusSubject: 'Social Studies',
    grade: 'Grade 2',
    topic: 'Transport & Infrastructure',
    subtopic: 'Modes of Land, Water & Air Transport',
    tags: ['car', 'airplane', 'ship', 'transport', 'vehicles'],
    svgContent: `<svg viewBox="0 0 400 180" width="100%" height="160" xmlns="http://www.w3.org/2000/svg" style="background:#eff6ff; border-radius:12px; border:1px solid #bfdbfe; padding:8px;">
      <g transform="translate(15,15)">
        <rect x="0" y="0" width="110" height="135" rx="8" fill="#ffffff" stroke="#93c5fd"/>
        <text x="55" y="45" text-anchor="middle" font-size="36">🚗</text>
        <text x="55" y="80" text-anchor="middle" font-weight="bold" font-size="11" fill="#1e3a8a">Land Transport</text>
        <text x="55" y="105" text-anchor="middle" font-size="10" fill="#3b82f6">(Motor Car / Bus)</text>
      </g>
      <g transform="translate(145,15)">
        <rect x="0" y="0" width="110" height="135" rx="8" fill="#ffffff" stroke="#93c5fd"/>
        <text x="55" y="45" text-anchor="middle" font-size="36">✈️</text>
        <text x="55" y="80" text-anchor="middle" font-weight="bold" font-size="11" fill="#1e3a8a">Air Transport</text>
        <text x="55" y="105" text-anchor="middle" font-size="10" fill="#3b82f6">(Aeroplane)</text>
      </g>
      <g transform="translate(275,15)">
        <rect x="0" y="0" width="110" height="135" rx="8" fill="#ffffff" stroke="#93c5fd"/>
        <text x="55" y="45" text-anchor="middle" font-size="36">🚢</text>
        <text x="55" y="80" text-anchor="middle" font-weight="bold" font-size="11" fill="#1e3a8a">Water Transport</text>
        <text x="55" y="105" text-anchor="middle" font-size="10" fill="#3b82f6">(Ship / Boat)</text>
      </g>
    </svg>`
  },

  // 6. ELECTRICITY & CIRCUITS
  {
    title: 'Simple Electric Circuit (Battery, Switch & Bulb)',
    category: 'science',
    section: 'Section C (Essay)',
    syllabusSubject: 'Physics / Integrated Science',
    grade: 'Grade 7',
    topic: 'Electricity & Energy',
    subtopic: 'Simple Electric Circuit',
    tags: ['circuit', 'battery', 'switch', 'bulb', 'electricity'],
    svgContent: `<svg viewBox="0 0 400 180" width="100%" height="160" xmlns="http://www.w3.org/2000/svg" style="background:#fafafa; border-radius:12px; border:1px solid #e5e5e5; padding:8px;">
      <!-- Wires -->
      <rect x="50" y="30" width="300" height="110" fill="none" stroke="#2563eb" stroke-width="3" rx="10"/>
      <!-- Battery -->
      <rect x="35" y="70" width="30" height="30" fill="#dc2626" rx="4"/>
      <text x="50" y="88" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">+ -</text>
      <text x="50" y="118" text-anchor="middle" font-size="10" font-weight="bold" fill="#991b1b">Battery</text>
      <!-- Switch -->
      <line x1="180" y1="30" x2="220" y2="15" stroke="#16a34a" stroke-width="4" stroke-linecap="round"/>
      <circle cx="180" cy="30" r="5" fill="#16a34a"/>
      <circle cx="220" cy="30" r="5" fill="#16a34a"/>
      <text x="200" y="10" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Switch (Open)</text>
      <!-- Bulb -->
      <circle cx="350" cy="85" r="18" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <text x="350" y="90" text-anchor="middle" font-size="14">💡</text>
      <text x="350" y="118" text-anchor="middle" font-size="10" font-weight="bold" fill="#854d0e">Bulb</text>
    </svg>`
  },

  // 7. MATHEMATICS, FRACTIONS & SHAPES
  {
    title: 'Visual Fraction Circles & Shaded Parts',
    category: 'math',
    section: 'Section A (MCQ)',
    syllabusSubject: 'Mathematics',
    grade: 'Grade 3',
    topic: 'Fractions & Decimals',
    subtopic: 'Visual Fraction Circles & Shading',
    tags: ['fraction', 'half', 'quarter', 'circle', 'math'],
    svgContent: `<svg viewBox="0 0 400 180" width="100%" height="160" xmlns="http://www.w3.org/2000/svg" style="background:#f0fdf4; border-radius:12px; border:1px solid #bbf7d0; padding:8px;">
      <!-- 1/2 Circle -->
      <g transform="translate(70,80)">
        <path d="M 0 0 L 45 0 A 45 45 0 0 1 -45 0 Z" fill="#16a34a"/>
        <circle cx="0" cy="0" r="45" fill="none" stroke="#15803d" stroke-width="2"/>
        <text x="0" y="65" text-anchor="middle" font-weight="bold" font-size="12" fill="#166534">Fraction = 1/2</text>
      </g>
      <!-- 3/4 Circle -->
      <g transform="translate(200,80)">
        <path d="M 0 0 L 45 0 A 45 45 0 1 1 0 -45 Z" fill="#22c55e"/>
        <circle cx="0" cy="0" r="45" fill="none" stroke="#15803d" stroke-width="2"/>
        <text x="0" y="65" text-anchor="middle" font-weight="bold" font-size="12" fill="#166534">Fraction = 3/4</text>
      </g>
      <!-- 1/4 Circle -->
      <g transform="translate(330,80)">
        <path d="M 0 0 L 45 0 A 45 45 0 0 1 0 45 Z" fill="#86efac"/>
        <circle cx="0" cy="0" r="45" fill="none" stroke="#15803d" stroke-width="2"/>
        <text x="0" y="65" text-anchor="middle" font-weight="bold" font-size="12" fill="#166534">Fraction = 1/4</text>
      </g>
    </svg>`
  },
  {
    title: '2D Geometrical Shapes & Polygons',
    category: 'math',
    section: 'Section A (MCQ)',
    syllabusSubject: 'Mathematics',
    grade: 'Grade 2',
    topic: 'Geometry & Shapes',
    subtopic: '2D Shapes & Polygons',
    tags: ['triangle', 'square', 'circle', 'rectangle', 'shapes'],
    svgContent: `<svg viewBox="0 0 400 180" width="100%" height="160" xmlns="http://www.w3.org/2000/svg" style="background:#faf5ff; border-radius:12px; border:1px solid #e9d5ff; padding:8px;">
      <!-- Triangle -->
      <polygon points="50,30 20,100 80,100" fill="#c084fc" stroke="#7e22ce" stroke-width="2"/>
      <text x="50" y="125" text-anchor="middle" font-weight="bold" font-size="11" fill="#6b21a8">A. Triangle</text>
      <!-- Square -->
      <rect x="130" y="35" width="65" height="65" fill="#a855f7" stroke="#7e22ce" stroke-width="2"/>
      <text x="162" y="125" text-anchor="middle" font-weight="bold" font-size="11" fill="#6b21a8">B. Square</text>
      <!-- Circle -->
      <circle cx="265" cy="68" r="35" fill="#e879f9" stroke="#7e22ce" stroke-width="2"/>
      <text x="265" y="125" text-anchor="middle" font-weight="bold" font-size="11" fill="#6b21a8">C. Circle</text>
      <!-- Rectangle -->
      <rect x="330" y="45" width="60" height="50" fill="#f0abfc" stroke="#7e22ce" stroke-width="2"/>
      <text x="360" y="125" text-anchor="middle" font-weight="bold" font-size="11" fill="#6b21a8">D. Rectangle</text>
    </svg>`
  }
];

export function getSavedAccountDiagrams(): EducationalDiagram[] {
  try {
    const raw = safeLocalStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const initialized = SEEDED_EDUCATIONAL_DIAGRAMS.map((d, i) => ({
        ...d,
        id: `seeded-diagram-${i + 1}`,
        createdAt: new Date().toISOString(),
        syncedToAccount: true,
      }));
      safeLocalStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialized));
      return initialized;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveDiagramToAccount(diagramData: Omit<EducationalDiagram, 'id' | 'createdAt' | 'syncedToAccount'>, userEmail?: string): Promise<EducationalDiagram> {
  const currentList = getSavedAccountDiagrams();
  const newDiagram: EducationalDiagram = {
    ...diagramData,
    id: `diag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    userEmail,
    syncedToAccount: true,
  };

  const updated = [newDiagram, ...currentList];
  safeLocalStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

  try {
    if (db) {
      const diagramsCol = collection(db, 'assessment_diagrams');
      await addDoc(diagramsCol, {
        ...newDiagram,
        serverTimestamp: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Firestore diagram sync notice (stored locally):', err);
  }

  return newDiagram;
}

export interface DiagramFilterOptions {
  query?: string;
  category?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
}

export function searchDiagrams(
  queryOrOptions?: string | DiagramFilterOptions,
  categoryFilter?: string
): EducationalDiagram[] {
  const all = getSavedAccountDiagrams();

  let q = '';
  let category = 'all';
  let grade = '';
  let subject = '';
  let topic = '';
  let subtopic = '';

  if (typeof queryOrOptions === 'object' && queryOrOptions !== null) {
    q = (queryOrOptions.query || '').toLowerCase().trim();
    category = queryOrOptions.category || categoryFilter || 'all';
    grade = (queryOrOptions.grade || '').toLowerCase().trim();
    subject = (queryOrOptions.subject || '').toLowerCase().trim();
    topic = (queryOrOptions.topic || '').toLowerCase().trim();
    subtopic = (queryOrOptions.subtopic || '').toLowerCase().trim();
  } else if (typeof queryOrOptions === 'string') {
    q = queryOrOptions.toLowerCase().trim();
    category = categoryFilter || 'all';
  }

  const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  return all.filter(d => {
    // 1. Category check
    if (category && category !== 'all' && d.category !== category) {
      return false;
    }

    // 2. Grade check
    if (grade && grade !== 'all') {
      const gClean = cleanStr(grade);
      const dGClean = cleanStr(d.grade);
      if (gClean && dGClean) {
        const hasMatch = gClean.includes(dGClean) || dGClean.includes(gClean);
        if (!hasMatch) {
          // If no match but both have numbers, and numbers differ, filter out
          const gNum = grade.match(/\d+/);
          const dNum = d.grade.match(/\d+/);
          if (gNum && dNum && gNum[0] !== dNum[0]) {
            return false;
          }
        }
      }
    }

    // 3. Subject check
    if (subject && subject !== 'all') {
      const sClean = cleanStr(subject);
      const dSClean = cleanStr(d.syllabusSubject);
      if (sClean && dSClean) {
        const hasMatch = sClean.includes(dSClean) || dSClean.includes(sClean) ||
                         (sClean.includes('science') && dSClean.includes('science')) ||
                         (sClean.includes('math') && dSClean.includes('math')) ||
                         (sClean.includes('studies') && dSClean.includes('studies')) ||
                         (sClean.includes('english') && dSClean.includes('english')) ||
                         (sClean.includes('literacy') && dSClean.includes('literacy'));
        if (!hasMatch) {
          return false;
        }
      }
    }

    // 4. Topic check
    if (topic && topic !== 'all') {
      const tClean = cleanStr(topic);
      const dTClean = cleanStr(d.topic);
      if (tClean && dTClean) {
        const hasMatch = tClean.includes(dTClean) || dTClean.includes(tClean) ||
                         tClean.split(' ').some(w => w.length > 3 && dTClean.includes(w));
        if (!hasMatch) {
          // Allow loose match to keep diagrams list populated if possible
        }
      }
    }

    // 5. Subtopic check
    if (subtopic && subtopic !== 'all') {
      const subClean = cleanStr(subtopic);
      const dSubClean = cleanStr(d.subtopic || '');
      if (subClean && dSubClean) {
        const hasMatch = subClean.includes(dSubClean) || dSubClean.includes(subClean) ||
                         subClean.split(' ').some(w => w.length > 3 && dSubClean.includes(w));
        if (!hasMatch) {
          // Keep it loose
        }
      }
    }

    // 6. Free text search query check
    if (!q) return true;
    return (
      d.title.toLowerCase().includes(q) ||
      d.topic.toLowerCase().includes(q) ||
      (d.subtopic && d.subtopic.toLowerCase().includes(q)) ||
      d.syllabusSubject.toLowerCase().includes(q) ||
      d.grade.toLowerCase().includes(q) ||
      d.tags.some(t => t.toLowerCase().includes(q))
    );
  });
}

export function getDiagramsGroupedByTopic(
  queryOrOptions?: string | DiagramFilterOptions,
  categoryFilter?: string
): Record<string, EducationalDiagram[]> {
  const filtered = searchDiagrams(queryOrOptions, categoryFilter);
  const grouped: Record<string, EducationalDiagram[]> = {};

  filtered.forEach(diag => {
    const topicKey = diag.topic || 'General Topics';
    if (!grouped[topicKey]) {
      grouped[topicKey] = [];
    }
    grouped[topicKey].push(diag);
  });

  return grouped;
}
