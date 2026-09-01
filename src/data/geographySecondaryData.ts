import { Topic } from './syllabi';

export const geographyForm1: Topic[] = [
  {
    title: "1.1 GEOGRAPHY",
    generalCompetency: "Understand the meaning, major concepts, branches, and importance of studying Geography",
    subtopics: [
      {
        title: "1.1.1 Introduction to Geography",
        competencies: [
          "1.1.1.1 Demonstrate understanding of Geography: defining major concepts, classifying Physical and Human branches, and analyzing the importance of studying geography for spatial awareness and environmental conservation"
        ],
        learningActivities: [
          "Discussing the meaning of Geography as the scientific study of Earth's physical features, human activities, and their spatial interrelationships",
          "Classifying primary branches of Geography: Physical Geography (geomorphology, climatology, hydrology, biogeography) and Human Geography (economic, population, settlement, urban)",
          "Analysing the practical importance of studying geography: environmental conservation, spatial navigational skills, resource management, GIS technology, and career opportunities (meteorology, urban planning, cartography, surveying)"
        ],
        expectedStandard: "Understanding of Geography concepts, branches, and practical significance demonstrated clearly"
      }
    ]
  },
  {
    title: "1.2 THE SOLAR SYSTEM",
    generalCompetency: "Understand Earth's planetary position, shape, rotation, revolution, graticule coordinate calculations, and atmospheric layers",
    subtopics: [
      {
        title: "1.2.1 The Earth in the Solar System",
        competencies: [
          "1.2.1.1 Demonstrate understanding of the position of the Earth in the solar system, identifying celestial bodies and observing astronomical events"
        ],
        learningActivities: [
          "Identifying celestial elements found in the Solar System: the Sun, eight planets (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune), dwarf planets, moons, asteroids, comets, and meteors",
          "Engaging in celestial observation: visible planets, phases of the Moon, constellations, solar and lunar eclipses, and meteor showers"
        ],
        expectedStandard: "Understanding of Earth's position in the solar system and celestial elements demonstrated correctly"
      },
      {
        title: "1.2.2 Shape and Size of the Earth",
        competencies: [
          "1.2.2.1 Use model of the earth to show the Earth's shape and size, analyzing empirical proofs and relating sphericity to human/natural phenomena"
        ],
        learningActivities: [
          "Describing the shape (geoid / oblate spheroid) and dimensions of the Earth (equatorial diameter ~12,756 km, polar diameter ~12,714 km, equatorial circumference ~40,075 km)",
          "Analysing empirical proofs of Earth's spherical shape: circumnavigation, ship visibility over the horizon, lunar eclipse circular shadow, sunrise/sunset time differences, high-altitude curved horizons, aerial and satellite photography",
          "Relating Earth's curvature to natural and technological activities: climatic heat zones, global wind/ocean circulation patterns, and line-of-sight satellite telecommunications"
        ],
        expectedStandard: "Model of the Earth used accurately to demonstrate shape, dimensions, and practical proofs of sphericity"
      },
      {
        title: "1.2.3 Movements of the Earth",
        competencies: [
          "1.2.3.1 Apply knowledge of earth movements in different situations: Earth's rotation (day/night, Coriolis deflection, time zones) and Earth's revolution (seasons, varying day length, equinoxes, solstices, eclipses)"
        ],
        learningActivities: [
          "Examining Earth's Rotation on its 23.5° tilted axis from West to East (24 hours): alternation of day and night, time differences (15° longitude = 1 hour), deflection of planetary winds (Ferrel's Law / Coriolis effect), ocean tides",
          "Examining Earth's Revolution around the Sun in an elliptical orbit (365.25 days): four seasons (summer, autumn, winter, spring), varying lengths of day and night, changing altitude of the midday sun, solar and lunar eclipses",
          "Applying rotational/revolution knowledge in real-world planning: calendar construction, flight scheduling across international time zones, agricultural seasonal forecasting"
        ],
        expectedStandard: "Knowledge of Earth's rotation and revolution applied accurately to explain planetary and diurnal phenomena"
      },
      {
        title: "1.2.4 Earth's Graticule",
        competencies: [
          "1.2.4.1 Use latitudes and longitudes to locate places on the globe and GIS platforms",
          "1.2.4.2 Apply calculations of time and longitude in different situations",
          "1.2.4.3 Use latitude to calculate distance ($1^\\circ\\text{ latitude} = 111\\text{ km}$)",
          "1.2.4.4 Apply calculations of the midday sun in real-life (angle of elevation, estimating local solar time, passive solar building orientation)"
        ],
        learningActivities: [
          "Describing parallels of latitude (Equator 0°, Tropics of Cancer 23.5°N and Capricorn 23.5°S, Arctic 66.5°N and Antarctic 66.5°S Circles, Poles 90°) and meridians of longitude (Prime Meridian 0°, International Date Line 180°)",
          "Locating coordinates using topographical maps, globes, and Geographic Information System (GIS) tools",
          "Calculating local solar time and standard time: using $1^\\circ = 4\\text{ minutes}$, $15^\\circ = 1\\text{ hour}$, adding time going East ('East-Gain-Add' EGA) and subtracting going West ('West-Lose-Subtract' WLS)",
          "Computing great circle distances along meridians: $\\text{Distance} = \\Delta\\text{Latitude} \\times 111\\text{ km}$",
          "Calculating the midday sun altitude: $\\text{Angle of Elevation} = 90^\\circ - \\text{Zenith Distance} \\pm \\text{Solar Declination}$ and orienting solar photovoltaic panels for maximum insolation"
        ],
        expectedStandard: "Earth's graticule coordinates utilized, and time, distance, and midday sun angles calculated accurately"
      },
      {
        title: "1.2.5 The Earth's Atmosphere",
        competencies: [
          "1.2.5.1 Protect Earth's atmosphere: identifying concentric layers, understanding atmospheric life-support roles, and engaging in environmental preservation"
        ],
        learningActivities: [
          "Identifying atmospheric layers: Troposphere (weather zone, lapse rate $6.5^\\circ\\text{C}/1000\\text{m}$), Stratosphere (ozone layer $O_3$), Mesosphere (coldest layer, meteor burn-up), Thermosphere/Ionosphere (auroras, radio wave reflection), and Exosphere",
          "Explaining essential atmospheric functions: providing breathable oxygen/nitrogen, shielding from solar ultraviolet (UV) radiation, natural greenhouse heat retention, hydrological cycle driving engine",
          "Participating in atmospheric protection: tree planting, reducing greenhouse gas emissions, adopting clean public transit, curbing open-air burning, and conserving energy"
        ],
        expectedStandard: "Structure and protective mechanisms of Earth's atmosphere understood and conservation actions practiced"
      }
    ]
  },
  {
    title: "1.3 WEATHER AND CLIMATE",
    generalCompetency: "Measure weather elements, analyze Zambian climate, evaluate climate change drivers and impacts, and implement mitigation/adaptation",
    subtopics: [
      {
        title: "1.3.1 Weather and Climate",
        competencies: [
          "1.3.1.1 Apply knowledge of weather and climate in daily activities: distinguishing weather and climate, recording weather elements, and analyzing factors influencing Zambian climate"
        ],
        learningActivities: [
          "Distinguishing weather (short-term day-to-day atmospheric state) from climate (average weather conditions recorded over 30–35 years)",
          "Measuring weather elements: temperature (Six's Maximum and Minimum Thermometer), humidity (Hygrometer/psychrometer), atmospheric pressure (Barometer), rainfall (Rain Gauge), wind speed (Anemometer), wind direction (Wind Vane), sunshine (Campbell-Stokes Sunshine Recorder)",
          "Analysing climate controls in Zambia: latitude, altitude (moderating plateau temperatures), distance from the sea (continentality), prevailing winds (North-East Monsoon, South-East Trades, Zaire/Congo Air Boundary), and ITCZ seasonal migrations",
          "Characterizing Zambia's 3 distinct seasons: Cool Dry (May–August), Hot Dry (September–November), and Warm Wet (December–April)"
        ],
        expectedStandard: "Weather elements recorded accurately and factors governing Zambian climate analyzed thoroughly"
      },
      {
        title: "1.3.2 Climate Change",
        competencies: [
          "1.3.2.1 Analyse climate change: human drivers (fossil fuels, deforestation, industrial agriculture), natural drivers, and socioeconomic impacts"
        ],
        learningActivities: [
          "Identifying anthropogenic causes: greenhouse gas emissions ($CO_2, CH_4, N_2O$, CFCs) from thermal power plants, vehicular transport, biomass burning, and industrial livestock",
          "Identifying natural causes: solar irradiance cycles, volcanic ash/gas emissions, orbital Milankovitch cycles",
          "Analysing climate change impacts: rising mean temperatures, prolonged droughts, erratic rainfall patterns, flash floods, agricultural crop failures, water table depletion, and wildlife habitat loss in Southern Africa"
        ],
        expectedStandard: "Natural and anthropogenic causes and multidimensional impacts of climate change analyzed objectively"
      },
      {
        title: "1.3.3 Mitigation and Adaptation to Climate Change",
        competencies: [
          "1.3.3.1 Practise mitigation measures to climate change (renewable energy, afforestation, waste reduction, energy efficiency)",
          "1.3.3.2 Adapt lifestyles to local climate risks and disasters (drought-resistant crops, rainwater harvesting, emergency preparedness)"
        ],
        learningActivities: [
          "Executing climate mitigation actions: switching to solar/hydro energy, afforestation and reforestation, agroforestry, composting organic waste, reducing single-use plastics",
          "Implementing climate adaptation practices: planting early-maturing and drought-tolerant seed varieties (sorghum, millet, orange maize, cowpeas), constructing rooftop rainwater harvesting tanks, drip irrigation, and formulating family emergency disaster response plans"
        ],
        expectedStandard: "Mitigation strategies practiced and climate-resilient lifestyle adaptation measures implemented effectively"
      }
    ]
  },
  {
    title: "1.4 NATURAL RESOURCES",
    generalCompetency: "Classify renewable/non-renewable resources, evaluate population-resource dynamics, and practice sustainable conservation",
    subtopics: [
      {
        title: "1.4.1 Natural Resources",
        competencies: [
          "1.4.1.1 Use Renewable and non-Renewable resources responsibly"
        ],
        learningActivities: [
          "Classifying natural resources: Renewable (solar energy, wind, water, fertile soil, forests, wildlife) vs Non-Renewable (fossil fuels, copper, cobalt, coal, gemstones)",
          "Practicing responsible resource utilization: minimizing wastage, adopting circular economy 3Rs (Reduce, Reuse, Recycle), substituting fossil fuels with clean solar/hydro alternatives"
        ],
        expectedStandard: "Renewable and non-renewable natural resources classified and used responsibly"
      },
      {
        title: "1.4.2 Population and Natural Resources",
        competencies: [
          "1.4.2.1 Analyse the relationship between population and natural resources (resource distribution, over-exploitation, carrying capacity, sustainable consumption)"
        ],
        learningActivities: [
          "Analysing how resource concentration (fertile soils, copper deposits, abundant water along the Line of Rail) attracts dense human settlements",
          "Examining ecological carrying capacity and the consequences of unsustainable population pressure: deforestation, soil erosion, water scarcity, depletion of fish stocks, and environmental pollution",
          "Promoting sustainable consumption, water harvesting, and family planning awareness"
        ],
        expectedStandard: "The relationship between demographic growth and resource carrying capacity analyzed accurately"
      },
      {
        title: "1.4.3 Sustainable Management of Natural Resources",
        competencies: [
          "1.4.3.1 Practise sustainable management of natural resources (conservation farming, watershed protection, wildlife conservation, environmental school clubs)"
        ],
        learningActivities: [
          "Implementing conservation agriculture principles: minimum soil disturbance (zero-tillage / pot-holing), permanent organic soil cover (mulching), crop rotation with legumes",
          "Protecting biodiversity, community gene banks, wetlands (*dambos*), and establishing school environmental/wildlife clubs"
        ],
        expectedStandard: "Sustainable resource management and conservation agriculture practices executed appropriately"
      }
    ]
  },
  {
    title: "1.5 POPULATION",
    generalCompetency: "Master population dynamics, pyramid construction, Zambian demographic distribution, rapid growth challenges, and migration patterns",
    subtopics: [
      {
        title: "1.5.1 Population Composition",
        competencies: [
          "1.5.1.1 Demonstrate understanding of population composition: demographic concepts, constructing and interpreting population pyramids"
        ],
        learningActivities: [
          "Defining demographic terms: Population, Census, Crude Birth Rate (CBR), Crude Death Rate (CDR), Infant Mortality Rate (IMR), Fertility Rate, Life Expectancy, Population Density",
          "Constructing and interpreting age-sex population pyramids: broad-based expansive pyramids (developing nations with high dependency ratio) vs constrictive/stationary pyramids (developed nations)",
          "Evaluating socioeconomic resource implications of a youthful population structure (schooling, healthcare, youth employment)"
        ],
        expectedStandard: "Population composition concepts understood and age-sex pyramids constructed and interpreted accurately"
      },
      {
        title: "1.5.2 Population Distribution in Zambia",
        competencies: [
          "1.5.2.1 Analyse population distribution across Zambia using GIS and thematic maps (sparse, moderate, and dense settlement corridors)"
        ],
        learningActivities: [
          "Mapping population densities on the map of Zambia: densely populated areas (Lusaka and Copperbelt provinces along the Line of Rail), moderately populated areas (Eastern and Southern plateaus), sparsely populated areas (Western semi-arid sands, Luangwa Valley, North-Western rural districts)",
          "Analysing influencing factors: physical (rainfall, soil fertility, relief, tsetse fly distribution, water supply) and human/economic (mining towns, industrial infrastructure, electricity, transport corridors)"
        ],
        expectedStandard: "Spatial population distribution in Zambia analyzed using topographical and GIS maps"
      },
      {
        title: "1.5.3 Rapid Population Growth in Zambia",
        competencies: [
          "1.5.3.1 Address challenges of rapid population growth in Zambia: analyzing causes, socioeconomic effects, potential benefits, and interventions"
        ],
        learningActivities: [
          "Accounting for causes of rapid population growth: declining infant mortality, high fertility rates, early marriages, improved healthcare access",
          "Analysing negative effects: youth unemployment, pressure on schools/hospitals, growth of informal peri-urban shantytowns, rising crime rates, municipal waste strain",
          "Identifying potential benefits: expansive domestic consumer market, abundant labor force, national defense manpower",
          "Formulating interventions: girl-child education, reproductive health sensitization, decentralized economic investment"
        ],
        expectedStandard: "Causes, impacts, and solutions to rapid population growth addressed comprehensively"
      },
      {
        title: "1.5.4 Migration",
        competencies: [
          "1.5.4.1 Apply knowledge of migration in aspects of daily life: types (internal, rural-urban, international), push/pull factors, and impacts on origin and destination areas"
        ],
        learningActivities: [
          "Classifying migration types: internal (rural-to-urban, rural-to-rural, urban-to-rural, seasonal pastoralism) and international (immigration, emigration, refugee flows)",
          "Analysing push factors (rural poverty, crop failure, lack of electricity/tertiary facilities) vs pull factors (urban wage employment, modern healthcare, higher education, social amenities)",
          "Evaluating impacts: destination areas (labor supply vs overcrowding and housing deficits) and origin areas (remittances vs brain drain and rural agricultural labor shortages)"
        ],
        expectedStandard: "Types, push/pull drivers, and socioeconomic impacts of migration analyzed and applied"
      }
    ]
  },
  {
    title: "1.6 SETTLEMENTS",
    generalCompetency: "Understand settlement hierarchy, patterns, siting determinants, and resolve urban/rural settlement challenges",
    subtopics: [
      {
        title: "1.6.1 Settlements",
        competencies: [
          "1.6.1.1 Promote orderliness in settlements: classifying settlements by hierarchy (homestead to metropolis) and patterns (linear, nucleated, dispersed)"
        ],
        learningActivities: [
          "Classifying settlement hierarchy: isolated homestead $\\to$ hamlet $\\to$ village $\\to$ minor town $\\to$ large town $\\to$ city $\\to$ metropolis",
          "Identifying and diagramming settlement patterns: Linear / Ribbon (along roads, railways, river banks), Nucleated / Clustered (around crossroads, market centers, water wells), and Dispersed / Isolated (commercial farmlands)",
          "Promoting community orderliness, neighborhood spatial planning, and civic sanitation"
        ],
        expectedStandard: "Settlement hierarchy and structural spatial patterns classified and diagrammed correctly"
      },
      {
        title: "1.6.2 Location of Settlements",
        competencies: [
          "1.6.2.1 Make settlement choices: evaluating site and situation factors (relief, water supply, defense, soil fertility, transport, administrative and commercial functions)"
        ],
        learningActivities: [
          "Analysing physical siting factors (elevation above floodplains, perennial water availability, fertile arable soils, natural defensive hills) and economic factors (mineral extraction, junction nodal routes, market access)",
          "Classifying urban settlement functions: administrative capitals (Lusaka), commercial trading hubs (Kitwe, Ndola), tourist gateways (Livingstone), mining towns (Solwezi, Luanshya), border ports (Chirundu, Nakonde, Kasumbalesa)",
          "Selecting sustainable residential locations aligning with security, transportation, and amenities"
        ],
        expectedStandard: "Physical and functional determinants of settlement location evaluated and informed settlement choices made"
      },
      {
        title: "1.6.3 Challenges in Settlements",
        competencies: [
          "1.6.3.1 Resolve challenges experienced in settlements: rural infrastructure deficits vs urban congestion, informal settlements, and environmental degradation"
        ],
        learningActivities: [
          "Identifying settlement challenges: Rural (poor road connectivity, lack of piped water and grid electricity, distance to health clinics) vs Urban (overcrowding, inadequate storm drainage, traffic congestion, poor solid waste management)",
          "Formulating practical solutions: Rural (feeder road maintenance, borehole drilling, solar mini-grids) vs Urban (waste recycling campaigns, urban tree planting, upgraded sanitation, decentralized markets)"
        ],
        expectedStandard: "Rural and urban settlement challenges evaluated and practical community solutions formulated"
      }
    ]
  },
  {
    title: "1.7 URBANISATION",
    generalCompetency: "Relate urbanisation causes, spatial impacts, traffic solutions, and municipal greening to everyday life and the environment",
    subtopics: [
      {
        title: "1.7.1 Urbanisation",
        competencies: [
          "1.7.1.1 Relate urbanisation to daily lives and environment: physical/economic drivers, socioeconomic impacts, urban greening, and traffic management"
        ],
        learningActivities: [
          "Defining urbanisation as the increasing proportion of a country's population living in urban centers",
          "Analysing causes of rapid urbanisation: rural-urban migration, industrial development, infrastructure centralisation",
          "Evaluating impacts: economic expansion and cultural diversity vs traffic gridlock, air pollution, high rental costs, pressure on public utilities",
          "Relating urbanisation to daily life: participating in municipal clean-up campaigns, planting shade trees, adopting carpooling/public transport, and observing road safety"
        ],
        expectedStandard: "Urbanisation drivers, socioeconomic impacts, and municipal environmental solutions related to daily life"
      }
    ]
  }
];

export const geographyForm2: Topic[] = [
  {
    title: "2.1 BASIC MAP READING TECHNIQUES",
    generalCompetency: "Master map symbols, 4-figure and 6-figure grid references, relief interpretation, gradient calculations, terrain profiles, drainage, bearings, and distance/area measurement",
    subtopics: [
      {
        title: "2.1.1 Maps and Diagrams",
        competencies: [
          "2.1.1.1 Demonstrate understanding of maps and diagrams: differentiating maps and diagrams, and identifying essential marginal cartographic elements"
        ],
        learningActivities: [
          "Differentiating maps (scale representations of Earth's surface viewed from directly overhead) from diagrams and ground photographs",
          "Identifying the 6 essential qualities of a good map: Title, Scale, Key/Legend, North Direction arrow, Frame/Border, and Grid coordinate system"
        ],
        expectedStandard: "Differences between maps and diagrams understood and essential map qualities identified"
      },
      {
        title: "2.1.2 Map Symbols",
        competencies: [
          "2.1.2.1 Use symbols and legend to recognise features: natural features (rivers, hills, marshes) and man-made cultural features (roads, railways, settlements, power lines)"
        ],
        learningActivities: [
          "Interpreting standard Survey of Zambia topographical map symbols (1:50,000 scale)",
          "Classifying map colors: Brown (contours, relief), Blue (water bodies, marshes), Green (vegetation, forest reserves), Black/Red (buildings, roads, railways, place names)"
        ],
        expectedStandard: "Topographical map symbols and color conventions interpreted accurately"
      },
      {
        title: "2.1.3 Map Reading and Interpretation",
        competencies: [
          "2.1.3.1 Use 4-figure and 6-figure grid references to locate points or features accurately"
        ],
        learningActivities: [
          "Locating grid squares using 4-figure grid references (Eastings first, then Northings: 'Read Easting along the bottom, then Northing up the side')",
          "Pinpointing exact topographical features using 6-figure grid references (dividing grid squares into tenths for precision)"
        ],
        expectedStandard: "Four-figure and six-figure grid references read and plotted accurately on topographical maps"
      },
      {
        title: "2.1.4 Relief and Terrain Analysis",
        competencies: [
          "2.1.4.1 Use contours and other symbols to determine relief (spot heights, trigonometrical stations, bench marks, contour intervals)",
          "2.1.4.2 Analyse terrain: calculating gradient (Vertical Interval / Horizontal Equivalent), constructing cross-section land profiles, and assessing intervisibility"
        ],
        learningActivities: [
          "Interpreting contour patterns representing landforms: uniform gentle slopes, steep slopes, plateaus, valleys, spurs, ridges, saddles/cols, escarpments, passes, and knolls",
          "Calculating gradient: $\\text{Gradient} = \\frac{\\text{Vertical Interval (VI)}}{\\text{Horizontal Equivalent (HE)}}$ expressed as a ratio ($1:n$)",
          "Constructing cross-sectional relief profiles between two points on graph paper and determining intervisibility",
          "Evaluating land terrain suitability for agriculture, dam construction, road engineering, and identifying flood risk zones"
        ],
        expectedStandard: "Contour relief landforms interpreted, gradients calculated, and cross-section profiles constructed accurately"
      },
      {
        title: "2.1.5 Drainage Features",
        competencies: [
          "2.1.5.1 Analyse drainage patterns: dendritic, radial, trellis, parallel, rectangular, and identifying watersheds/catchments and flood-prone zones"
        ],
        learningActivities: [
          "Identifying drainage patterns on topographical maps: Dendritic (tree-like branching on homogeneous rocks), Trellis (right-angled tributaries on folded strata), Radial (radiating outward from a central dome/cone), Centripetal (flowing into an inland basin/lake)",
          "Tracing main river channels, identifying flow direction using contour V-shapes (pointing upstream), watersheds, confluences, and floodplains"
        ],
        expectedStandard: "Drainage networks and river flow directions on topographical maps analyzed correctly"
      },
      {
        title: "2.1.6 Land Use",
        competencies: [
          "2.1.6.1 Use symbols to interpret vegetation and land use (agriculture, settlement patterns, forest reserves, mining operations, transport networks)"
        ],
        learningActivities: [
          "Inferring economic land use from map evidence: commercial plantations (regular boundaries, estate roads), subsistence farming (scattered huts, tracks), forestry (forest reserves), mining (quarries, mine dumps, shaft symbols)",
          "Relating land use patterns to topography, soil fertility, and water drainage"
        ],
        expectedStandard: "Vegetation types and socioeconomic land use patterns inferred from map symbols accurately"
      },
      {
        title: "2.1.7 Direction and Orientation",
        competencies: [
          "2.1.7.1 Use compass bearing and cardinal directions for navigation (16-point compass, 3-figure whole circle bearings, magnetic declination)"
        ],
        learningActivities: [
          "Determining general direction using 16 cardinal points (N, NNE, NE, ENE, E, etc.)",
          "Measuring precise 3-figure angular bearings ($000^\\circ$ to $360^\\circ$) using a 360° protractor from true North and grid North",
          "Orienting topographical maps in the field using a magnetic compass and prominent physical landmarks"
        ],
        expectedStandard: "Compass cardinal directions and 3-figure whole circle bearings measured and plotted correctly"
      },
      {
        title: "2.1.8 Measurement of Distance and Area",
        competencies: [
          "2.1.8.1 Practise distance and area measurement: using linear scales, representative fractions (RF), statement scales, measuring straight/curved lines, and calculating irregular surface areas"
        ],
        learningActivities: [
          "Converting map scales: Representative Fraction (e.g. 1:50,000) $\\leftrightarrow$ Statement scale ($1\\text{ cm represents } 0.5\\text{ km}$)",
          "Measuring straight line distances using a ruler and curved routes (roads, winding rivers) using a piece of string or edge of paper along the linear scale bar",
          "Calculating land area on topographical maps using the grid square counting method (counting full and $\\ge 50\\%$ grid squares $\\times 1\\text{ km}^2$)"
        ],
        expectedStandard: "Straight and winding map distances measured and surface areas calculated accurately"
      }
    ]
  },
  {
    title: "2.2 BASIC RESEARCH SKILLS",
    generalCompetency: "Master geographical fieldwork methodology: formulation of research problems, sampling methods, data collection tools, analysis, and report presentation",
    subtopics: [
      {
        title: "2.2.1 Fieldwork",
        competencies: [
          "2.2.1.1 Analyse fieldwork: types (field studies, field research, field excursions) and practical importance of verifying classroom geographic theory in natural settings"
        ],
        learningActivities: [
          "Differentiating types of fieldwork: observational field excursions, structured field studies, and experimental hypothesis-driven field research",
          "Evaluating the importance of fieldwork: developing acute observational skills, data collection, critical analysis, and hands-on environmental problem solving"
        ],
        expectedStandard: "Nature, types, and academic importance of geographical fieldwork analyzed thoroughly"
      },
      {
        title: "2.2.2 Planning and Preparing for Field Work",
        competencies: [
          "2.2.2.1 Plan for field work: identifying research problems, formulating objectives/hypotheses, selecting sites, and organizing logistics"
        ],
        learningActivities: [
          "Identifying local geographical problems (e.g. gully erosion, solid waste dumping in townships, water quality at local streams)",
          "Formulating clear research SMART objectives and testable working hypotheses",
          "Organizing fieldwork logistics: reconnaissance visits, obtaining clearance permissions, assembling equipment (tape measures, clinometers, pH meters, maps, clipboards)"
        ],
        expectedStandard: "Fieldwork investigations planned systematically with clear objectives and logistics"
      },
      {
        title: "2.2.3 Data Collection / Fieldwork",
        competencies: [
          "2.2.3.1 Collect data in the field using probability/non-probability sampling methods, primary/secondary sources, and geographical measurement instruments"
        ],
        learningActivities: [
          "Applying sampling techniques: Random (simple random, systematic, stratified) and Non-random (purposive, quota, convenience sampling)",
          "Designing data collection instruments: structured questionnaires, semi-structured interview guides, field tally observation sheets",
          "Operating field instruments: clinometers for slope angles, anemometers for wind velocity, soil thermometers, and water testing kits"
        ],
        expectedStandard: "Primary field data collected accurately using valid sampling strategies and measurement tools"
      },
      {
        title: "2.2.4 Data Processing",
        competencies: [
          "2.2.4.1 Process Data: organizing raw data, tabulating frequency distributions, statistical analysis, graphical plotting, and drawing empirical conclusions"
        ],
        learningActivities: [
          "Organizing and cleaning raw data, compiling statistical frequency tables",
          "Plotting graphical visual representations: bar charts, pie charts, histograms, line graphs, scatter plots, and thematic distribution maps",
          "Synthesizing findings to accept or reject working hypotheses with supporting empirical data"
        ],
        expectedStandard: "Geographical field data organized, analyzed, graphed, and interpreted methodically"
      },
      {
        title: "2.2.5 Presenting Findings",
        competencies: [
          "2.2.5.1 Use findings to address local challenges: drafting comprehensive fieldwork reports, visual infographics, and communicating recommendations to community stakeholders"
        ],
        learningActivities: [
          "Writing a structured geographical fieldwork report: Title, Introduction, Study Area, Methodology, Data Presentation & Analysis, Discussion, Conclusion, and Recommendations",
          "Presenting actionable findings to school administrators, local civic leaders, and environmental councils to resolve localized community challenges"
        ],
        expectedStandard: "Fieldwork reports compiled professionally and research findings communicated to stakeholders"
      }
    ]
  },
  {
    title: "2.3 ENVIRONMENT",
    generalCompetency: "Understand environmental degradation, execute sustainable community protection practices, and analyze hazard risk reduction",
    subtopics: [
      {
        title: "2.3.1 Environment Degradation",
        competencies: [
          "2.3.1.1 Demonstrate understanding of environmental degradation: conducting local surveys to identify degraded areas, human/natural drivers, and environmental consequences"
        ],
        learningActivities: [
          "Conducting localized environmental degradation surveys: identifying gully erosion, deforested woodland, industrial effluent dumping, plastic pollution",
          "Evaluating drivers: uncontrolled charcoal production, open-pit stone quarrying, unsustainable farming on steep slopes, municipal sewer overflows"
        ],
        expectedStandard: "Forms, drivers, and consequences of environmental degradation surveyed and analyzed"
      },
      {
        title: "2.3.2 Environmental Protection",
        competencies: [
          "2.3.2.1 Conduct sustainable management practices: waste segregation, composting, soil stabilization, water conservation, and biodiversity habitats"
        ],
        learningActivities: [
          "Participating in hands-on environmental conservation: waste sorting (organic, paper, glass, plastic), making compost manure for school gardens",
          "Planting vetiver grass and indigenous trees for soil stabilization, installing water-saving taps, constructing local bird feeders and wildlife sanctuaries"
        ],
        expectedStandard: "Sustainable environmental management, waste segregation, and conservation practices conducted actively"
      },
      {
        title: "2.3.3 Environmental Hazards and Disasters",
        competencies: [
          "2.3.3.1 Analyse environmental hazards and disasters (floods, droughts, industrial lead contamination, chemical water pollution)",
          "2.3.3.2 Respond to natural hazards and disasters across preparedness, immediate emergency response, recovery, and mitigation"
        ],
        learningActivities: [
          "Analysing disaster case studies: seasonal flash floods in Lusaka peri-urban townships, recurring agricultural droughts in Southern Province, historic Kabwe lead poisoning",
          "Executing Disaster Risk Reduction (DRR) protocols: early warning system monitoring, emergency flood evacuation kits, first aid training, reporting hazards to DMMU (Disaster Management and Mitigation Unit)"
        ],
        expectedStandard: "Environmental hazards analyzed and effective disaster preparedness and response protocols executed"
      }
    ]
  },
  {
    title: "2.4 AGRO-ECOLOGICAL REGIONS IN ZAMBIA",
    generalCompetency: "Analyze Zambia's three Agro-Ecological Regions (AER I, II, III), soil profiles, rainfall characteristics, and agricultural crop/livestock adaptations",
    subtopics: [
      {
        title: "2.4.1 Zambia's Agro-Ecological Regions",
        competencies: [
          "2.4.1.1 Analyse Zambia's Agro Ecological Regions: identifying soil types, geographical coverage, and mapping AER I, AER II (IIa and IIb), and AER III"
        ],
        learningActivities: [
          "Mapping Zambia's Agro-Ecological Regions: Region I (Luangwa and Gwembe/Zambezi valleys, southern border), Region IIa (Central, Eastern, Lusaka, Southern fertile plateau), Region IIb (Kalahari sands in Western Province), Region III (Northern, Luapula, Copperbelt, North-Western high-rainfall plateaus)",
          "Examining soil distributions: sandy acidic soils in Region III, fertile loam clay soils in Region IIa, infertile Kalahari sands in Region IIb, shallow rocky/alluvial soils in Region I"
        ],
        expectedStandard: "Zambia's three Agro-Ecological Regions mapped, and soil characteristics analyzed accurately"
      },
      {
        title: "2.4.2 Climate and Agro-Ecological Regions",
        competencies: [
          "2.4.2.1 Establish relationship between climate and Agro-Ecological Regions: rainfall gradients ($<800\\text{ mm}$, $800\\text{--}1000\\text{ mm}$, $>1000\\text{ mm}$), temperature extremes, and farming seasons"
        ],
        learningActivities: [
          "Correlating climatic parameters with agro-ecological zones: AER I (hot semi-arid, low rainfall $<800\\text{ mm}$, short growing season 80–120 days, high drought risk), AER II (temperate, moderate rainfall $800\\text{--}1000\\text{ mm}$, growing season 100–140 days), AER III (cool/warm humid, high rainfall $1000\\text{--}1500\\text{ mm}$, long growing season 120–150+ days, highly leached soils)",
          "Relating climate zones to agricultural water management, irrigation demand, and agroforestry selection"
        ],
        expectedStandard: "Climatic parameters across Zambia's Agro-Ecological Regions established and correlated with agricultural potential"
      },
      {
        title: "2.4.3 Agriculture and Agro-Ecological Regions",
        competencies: [
          "2.4.3.1 Show a relationship between Agriculture and Agro-Ecological Regions: matching specialized crops, pastoral livestock systems, and aquaculture to regional conditions"
        ],
        learningActivities: [
          "Matching farming enterprises to regions: AER I (drought-resistant crops: sorghum, pearl millet, cotton, sesame, cowpeas, goat/cattle pastoralism), AER IIa (maize, soybeans, groundnuts, sunflower, wheat under irrigation, tobacco, beef/dairy cattle), AER IIb (cashew nuts, cassava, rice in Barotse floodplains, cattle transhumance), AER III (cassava, finger millet, tea, coffee, oil palm, sugarcane, pine/eucalyptus forestry plantations, aquaculture)",
          "Designing small-scale school agriculture and climate-adaptation farming projects tailored specifically to local ecological zone conditions"
        ],
        expectedStandard: "Relationship between regional agro-ecological conditions and suitable crop/livestock production systems shown clearly"
      }
    ]
  }
];

export const geographyForm3: Topic[] = [
  {
    title: "3.1 STRUCTURE OF THE EARTH",
    generalCompetency: "Understand Earth's internal concentric layers, mineral composition, rock classification, properties, and practical socioeconomic uses",
    subtopics: [
      {
        title: "3.1.1 Earth's Internal Structure",
        competencies: [
          "3.1.1.1 Demonstrate understanding of the internal structure of the earth: identifying, describing, and drawing concentric cross-sections of the Crust (Lithosphere), Mantle (Mesosphere/Asthenosphere), and Core (Barysphere)"
        ],
        learningActivities: [
          "Describing Earth's concentric layers: Crust/Lithosphere (Continental SIAL: silica/aluminium, density ~2.7 g/cm³; Oceanic SIMA: silica/magnesium, density ~3.0 g/cm³; Mohorovičić discontinuity), Mantle/Asthenosphere (semi-molten silicate peridotite, convection currents, Gutenberg discontinuity), Core/Barysphere (Outer liquid core and Inner solid core of NIFE: nickel/iron, extreme pressure and temperature)",
          "Drawing and labeling detailed scale cross-sections of Earth's internal layers"
        ],
        expectedStandard: "Earth's internal concentric structure, chemical composition, and discontinuities drawn and described accurately"
      },
      {
        title: "3.1.2 Types of Rocks",
        competencies: [
          "3.1.2.1 Relate rocks to everyday life: classifying Igneous, Sedimentary, and Metamorphic rocks by formation, texture, permeability, and practical uses"
        ],
        learningActivities: [
          "Classifying rocks by origin: Igneous (Intrusive/Plutonic: granite, gabbro; Extrusive/Volcanic: basalt, pumice, obsidian), Sedimentary (Mechanically formed: sandstone, shale; Organically formed: limestone, coal; Chemically formed: rock salt, gypsum), Metamorphic (marble from limestone, slate from shale, quartzite from sandstone, gneiss from granite)",
          "Relating rock types to daily life: building construction ballast (granite/basalt), cement manufacture (limestone), energy generation (coal), underground aquifers (permeable sandstone), sculpture/pottery (clay/marble)"
        ],
        expectedStandard: "Rock types classified by origin and characteristics, and their economic uses in daily life demonstrated"
      }
    ]
  },
  {
    title: "3.2 INTERNAL EARTH MOVEMENTS AND LAND FORMS",
    generalCompetency: "Understand plate tectonics, faulting, folding, rift valleys, block mountains, fold mountains, earthquakes, and volcanism",
    subtopics: [
      {
        title: "3.2.1 Landforms Formed by Faulting and Folding",
        competencies: [
          "3.2.1.1 Link faulting and folding to real life experiences: explaining tensional/compressional forces, landform formation (Rift Valleys, Block Mountains/Horsts, Fold Mountains, Escarpments), and socioeconomic significance"
        ],
        learningActivities: [
          "Explaining tectonic processes: compressional forces causing folding (anticlines, synclines, overfolds, overthrusts/nappes) and faulting (normal, reverse, tear/transform faults)",
          "Describing landforms formed: Fold Mountains (Himalayas, Andes, Alps, Atlas), Rift Valleys (East African Rift Valley system: Luangwa and Gwembe rift valleys), Block Mountains/Horsts (Rwenzori, Black Forest), Escarpments (Muchinga Escarpment in Zambia)",
          "Linking faulting/folding landforms to real life: scenic tourism, rift valley lakes (Lake Tanganyika, Lake Malawi), groundwater aquifers, hydrothermal hot springs, transport construction engineering challenges"
        ],
        expectedStandard: "Processes of folding and faulting explained, associated landforms diagrammed, and real-life linkages established"
      },
      {
        title: "3.2.2 Landforms Formed by Earthquakes and Volcanic Activities",
        competencies: [
          "3.2.2.1 Relate earthquakes and volcanic activity to the natural environment: intrusive/extrusive volcanic landforms and seismic tremors",
          "3.2.2.2 Evaluate the impacts of earthquakes and volcanic activities on environment (destruction vs fertile volcanic soils, geothermal energy, mineral deposits)"
        ],
        learningActivities: [
          "Explaining volcanism and landforms: Extrusive (composite volcanoes, lava plateaus, calderas, geysers) and Intrusive (batholiths, laccoliths, sills, dykes)",
          "Explaining earthquakes: focus, epicenter, seismic P and S waves, measuring intensity (Modified Mercalli Scale) and magnitude (Richter Scale)",
          "Evaluating impacts: Negative (loss of life, building collapse, tsunamis, volcanic pyroclastic flows, infrastructure destruction) vs Positive (fertile volcanic andosols for coffee farming, rich mineral mineralization, geothermal power generation, geotourism)"
        ],
        expectedStandard: "Volcanic and seismic landforms described, and positive/negative environmental impacts evaluated"
      }
    ]
  },
  {
    title: "3.3 WEATHERING AND MASS MOVEMENT (MASS WASTING)",
    generalCompetency: "Analyze mechanical, chemical, and biological weathering processes, causes of mass movement, and land management practices",
    subtopics: [
      {
        title: "3.3.1 Weathering",
        competencies: [
          "3.3.1.1 Relate weathering to real-life experiences: mechanical/physical, chemical, and biological weathering processes, landform evolution, and soil pedogenesis"
        ],
        learningActivities: [
          "Describing mechanical weathering: frost wedging / freeze-thaw, thermal expansion (exfoliation / onion peeling in semi-arid regions), pressure release / sheeting",
          "Describing chemical weathering: carbonation (solution in limestone karst caves), oxidation (rusting of iron-rich rocks), hydrolysis (feldspar to kaolin clay), hydration",
          "Describing biological weathering: root wedging by trees, burrowing animals, lichen/moss humic acids",
          "Relating weathering to everyday life: soil formation (pedogenesis), clay for ceramics, building monument decay, landscape degradation"
        ],
        expectedStandard: "Physical, chemical, and biological weathering processes differentiated and related to soil formation and infrastructure"
      },
      {
        title: "3.3.2 Mass Movement (Mass Wasting)",
        competencies: [
          "3.3.2.1 Relate mass movement to real-life experiences: gravity, slope steepness, water saturation, types (soil creep, landslides, mudflows, rockfalls, avalanches), and slope stabilization"
        ],
        learningActivities: [
          "Identifying triggers of mass wasting: gravity, slope gradient, water saturation, deforestation, road excavation undercut, seismic tremors",
          "Classifying mass movements: Slow (soil creep, solifluction) vs Rapid (landslides, mudflows, debris avalanches, rockfalls, slumping)",
          "Implementing slope disaster risk reduction: terracing steep slopes, retaining walls with weep holes, reforestation of denuded hillsides, proper roadside drainage"
        ],
        expectedStandard: "Types and triggers of mass wasting classified and slope stabilization engineering measures related to disaster management"
      }
    ]
  },
  {
    title: "3.4 RIVER PROCESSES",
    generalCompetency: "Understand the hydrological cycle, fluvial erosion, transportation, deposition across river stages, and sustainable water utilization",
    subtopics: [
      {
        title: "3.4.1 Hydrological Cycle",
        competencies: [
          "3.4.1.1 Practise sustainable use of water: diagramming the hydrological cycle, explaining closed system processes, and conserving community water resources"
        ],
        learningActivities: [
          "Drawing and explaining the global Hydrological Cycle: evaporation, evapotranspiration, condensation, precipitation, surface runoff, infiltration, percolation, and groundwater flow",
          "Practicing sustainable water usage: closing running taps, harvesting rooftop rainwater, wastewater recycling, protecting river riparian buffer zones, water table recharging"
        ],
        expectedStandard: "Hydrological cycle processes diagrammed correctly and sustainable water conservation measures practiced"
      },
      {
        title: "3.4.2 River System",
        competencies: [
          "3.4.2.1 Apply knowledge of river system in everyday life: drainage patterns (dendritic, trellis, radial), fluvial processes (erosion, transport, deposition), river course profiles (youthful, mature, old stage landforms), and multipurpose utilization"
        ],
        learningActivities: [
          "Examining river erosion (hydraulic action, abrasion/corrasion, attrition, solution/corrosion), transportation (traction, saltation, suspension, solution), and deposition",
          "Describing landforms across river stages: Youthful/Upper course (V-shaped valleys, interlocking spurs, gorges, waterfalls, rapids, potholes), Mature/Middle course (U-shaped valleys, river meanders, slip-off slopes, river cliffs), Old/Lower course (broad floodplains, oxbow lakes, natural levees, braided channels, deltas)",
          "Applying river systems to daily life: inland navigation, irrigation farming, hydroelectric generation (HEP), municipal water supply, alluvial sand mining, flood management"
        ],
        expectedStandard: "Fluvial erosion, transport, deposition landforms across river courses analyzed and multipurpose river uses applied"
      }
    ]
  },
  {
    title: "3.5 WEATHER AND CLIMATE",
    generalCompetency: "Master global climatic regions (Savannah, Hot Desert, Tropical Rainforest), cyclonic/anticyclonic weather systems, and disaster preparedness",
    subtopics: [
      {
        title: "3.5.1 Climatic Regions",
        competencies: [
          "3.5.1.1 Develop ways of adapting to climatic regions: locating Tropical Rainforest, Savannah, and Hot Deserts, analyzing climate-vegetation adaptations, and farming resilience"
        ],
        learningActivities: [
          "Mapping global climatic zones: Equatorial / Tropical Rainforest (Congo and Amazon basins: hot, wet all year $>2000\\text{ mm}$, dense layered canopy), Tropical Continental / Savannah (Zambia, East Africa: wet summer, dry winter, tall grasses, baobabs/acacias), Hot Tropical Deserts (Sahara, Kalahari, Namib: extreme heat, rainfall $<250\\text{ mm}$, xerophytic cacti, deep taproots)",
          "Analysing climate-vegetation-wildlife relationships in each biome and developing adaptive agricultural practices (nomadic pastoralism, oasis irrigation, agroforestry)"
        ],
        expectedStandard: "Global climatic regions mapped, vegetation adaptations analyzed, and resilient lifestyle adaptations developed"
      },
      {
        title: "3.5.2 Tropical and Temperate Cyclonic Activities",
        competencies: [
          "3.5.2.1 Plan for cyclonic Activities: formation of tropical cyclones and temperate depressions, cyclone/anticyclone structures, destructive impacts, and disaster management"
        ],
        learningActivities: [
          "Explaining formation of Tropical Cyclones (hurricanes/typhoons): warm sea surface temperatures ($>26.5^\\circ\\text{C}$), Coriolis force, low pressure center, revolving gale winds, eye, eyewall",
          "Contrasting Cyclones (low pressure, converging rising air, stormy wet weather) with Anticyclones (high pressure, descending diverging air, calm dry settled weather)",
          "Analysing cyclonic impacts in Southern Africa (e.g. Cyclone Idai, Cyclone Freddy: storm surges, catastrophic flooding, infrastructure loss) and planning emergency evacuation, food stockpiling, and disaster response"
        ],
        expectedStandard: "Formation and characteristics of cyclones and anticyclones explained and emergency cyclonic disaster plans formulated"
      }
    ]
  },
  {
    title: "3.6 POPULATION",
    generalCompetency: "Analyze world population distribution, density factors, and demographic structures of LEDCs vs MEDCs",
    subtopics: [
      {
        title: "3.6.1 World Population",
        competencies: [
          "3.6.1.1 Demonstrate understanding of world population distribution/density/structure: identifying densely, moderately, and sparsely populated regions, and contrasting LEDC and MEDC population pyramids"
        ],
        learningActivities: [
          "Mapping world population distribution: Densely populated (East Asia, South Asia, Western Europe, North-East USA), Sparsely populated (Polar ice caps, hot deserts, high mountain ranges, dense tropical rainforests)",
          "Contrasting demographic structures of Less Economically Developed Countries (LEDCs: high birth rate, high death rate, broad-based youthful pyramid, high youth dependency) with More Economically Developed Countries (MEDCs: low birth rate, low death rate, aging population, top-heavy stationary/constrictive pyramid)",
          "Evaluating economic implications: workforce shortages and pension burdens in MEDCs vs schooling, job creation, and healthcare strains in LEDCs"
        ],
        expectedStandard: "World population distribution patterns mapped and demographic structures of LEDCs and MEDCs compared objectively"
      }
    ]
  },
  {
    title: "3.7 GLOBAL PANDEMICS",
    generalCompetency: "Analyze the geographic and socioeconomic impacts of global health pandemics (HIV/AIDS and COVID-19) and adopt resilient coping strategies",
    subtopics: [
      {
        title: "3.7.1 HIV/AIDS and COVID-19",
        competencies: [
          "3.7.1.1 Adopt ways of coping with pandemics: assessing impacts of global pandemics on population, healthcare systems, and socioeconomic development, and executing preventive measures"
        ],
        learningActivities: [
          "Defining global pandemics as worldwide epidemics affecting substantial portions of global populations",
          "Analysing demographic and socioeconomic impacts: loss of productive human labor, declining life expectancy, strain on hospital infrastructure, economic lockdowns, school closures, supply chain disruption",
          "Adopting coping and prevention mechanisms: universal vaccination, public hygiene, adherence to antiretroviral therapy (ART), telemedicine, and health education"
        ],
        expectedStandard: "Socioeconomic impacts of pandemics evaluated and public health prevention and coping measures adopted"
      }
    ]
  }
];

export const geographyForm4: Topic[] = [
  {
    title: "4.1 ZAMBIA",
    generalCompetency: "Analyze Zambia's absolute and relative location, physical relief levels, drainage basins, and cultural infrastructure",
    subtopics: [
      {
        title: "4.1.1 Location of Zambia",
        competencies: [
          "4.1.1.1 Analyse implications of Zambia's location: absolute coordinates (Lat $8^\\circ\\text{--}18^\\circ\\text{S}$, Long $22^\\circ\\text{--}34^\\circ\\text{E}$) and relative position as a landlocked/landlinked country in Southern Africa"
        ],
        learningActivities: [
          "Locating Zambia using absolute coordinates (Latitude $8^\\circ\\text{S}$ to $18^\\circ\\text{S}$, Longitude $22^\\circ\\text{E}$ to $34^\\circ\\text{E}$) and identifying its 8 neighboring countries (DR Congo, Tanzania, Malawi, Mozambique, Zimbabwe, Botswana, Namibia, Angola)",
          "Analysing implications: Absolute location (tropical climate, summer rainfall, standard time GMT+2 / CAT) and Relative location (landlocked dependency on foreign ocean ports vs regional trade transit hub 'landlinked' opportunities within SADC and COMESA)"
        ],
        expectedStandard: "Absolute and relative location of Zambia mapped and economic/geopolitical implications analyzed"
      },
      {
        title: "4.1.2 Relief and Drainage",
        competencies: [
          "4.1.2.1 Relate relief and drainage features to real-life situations: Highveld ($>1200\\text{m}$), Middleveld ($900\\text{--}1200\\text{m}$), Lowveld ($<900\\text{m}$), and four primary river drainage basins (Zambezi, Kafue, Luangwa, Luapula/Chambeshi)"
        ],
        learningActivities: [
          "Classifying Zambia's relief levels: Highveld plateaus ($>1200\\text{m}$: Mafinga Hills, Nyika, Copperbelt, Mbala), Middleveld ($900\\text{--}1200\\text{m}$: Central/Southern plateaus), Lowveld rift valleys ($<900\\text{m}$: Luangwa and lower Zambezi valleys)",
          "Mapping major drainage networks: Zambezi basin, Kafue river basin, Luangwa river basin, Luapula-Chambeshi-Lake Mweru/Bangweulu system",
          "Relating relief and drainage to human activities: high plateau human settlement, rift valley wildlife parks, hydro-power sites (Kafue Gorge, Kariba, Victoria Falls), irrigation and water supply"
        ],
        expectedStandard: "Zambian relief levels and river drainage systems related to agriculture, tourism, and hydro-power generation"
      },
      {
        title: "4.1.3 Cultural Features",
        competencies: [
          "4.1.3.1 Promote cultural features of Zambia: transport infrastructure (roads, railways, bridges, pipelines), avoiding vandalism, and civic pride"
        ],
        learningActivities: [
          "Mapping major man-made cultural features: Great North Road, Great East Road, TAZARA railway, Zambia Railways, Kazungula Bridge, TAZAMA oil pipeline, electricity grid interconnections",
          "Promoting infrastructure protection against vandalism (preventing scrap metal theft of rail tracks/power cables), and participating in community road and public clean-up campaigns"
        ],
        expectedStandard: "Zambian cultural infrastructure mapped and active infrastructure stewardship promoted"
      }
    ]
  },
  {
    title: "4.2 FORESTRY IN ZAMBIA",
    generalCompetency: "Analyze indigenous vegetation types, commercial forest plantations, invasive plant species, and deforestation solutions",
    subtopics: [
      {
        title: "4.2.1 Vegetation of Zambia",
        competencies: [
          "4.2.1.1 Promote sustainable use of vegetation: indigenous woodland types (Miombo, Mopane, Munga, Riparian/Riverine, Montane, Swamp), exotic commercial plantations (pine, eucalyptus), and forest products"
        ],
        learningActivities: [
          "Classifying indigenous vegetation: Miombo woodlands (*Brachystegia, Julbernardia, Isoberlinia* dominating 70% of Zambia), Mopane (*Colophospermum mopane* in hot dry valleys), Munga savanna (*Acacia, Combretum* on fertile plateaus), Riparian riverine forests, Montane grasslands, Swamp forests (*Mushitu*)",
          "Identifying commercial exotic timber plantations: ZAFFICO plantations in Chichele, Chati, Itimpi on the Copperbelt, Shiwang'andu (Pine, Eucalyptus, Gmelina, Cypress)",
          "Evaluating timber and non-timber forest products: construction timber, traditional medicine, wild edible mushrooms (*bowa*), wild fruits (*masuku, mpundu*), honey/beekeeping, caterpillars (*ifinkubala*), and charcoal"
        ],
        expectedStandard: "Indigenous vegetation types and commercial forestry plantations classified and sustainable forest utilization promoted"
      },
      {
        title: "4.2.2 Invasive Plant Species in Zambia",
        competencies: [
          "4.2.2.1 Provide solutions to invasive plant species (Lantana camara, Kafue weed / Salvinia molesta, Mimosa pigra, Water hyacinth)"
        ],
        learningActivities: [
          "Identifying invasive plant species: *Lantana camara* (invades pastures and toxic to livestock), *Salvinia molesta* / Kafue weed and *Eichhornia crassipes* / Water Hyacinth (blocks river navigation, clogs hydro-turbines, depletes water oxygen killing fish), *Mimosa pigra*",
          "Formulating eradication solutions: physical mechanical harvesting, biological insect control (weevils), controlled chemical application, and public awareness"
        ],
        expectedStandard: "Threats of invasive plant species analyzed and biological/mechanical control solutions provided"
      },
      {
        title: "4.2.3 Deforestation",
        competencies: [
          "4.2.3.1 Address deforestation: analyzing causes (charcoal production, shifting cultivation/chitemene, logging, agriculture), ecological impacts, and conservation solutions"
        ],
        learningActivities: [
          "Examining causes of rapid deforestation: commercial charcoal production for urban energy, shifting cultivation (*chitemene* in Northern/Luapula), commercial agriculture clearance, unsustainable timber logging (*Mukula* / rosewood tree)",
          "Analysing consequences: soil erosion, desertification, destruction of watershed catchments, biodiversity loss, reduced rainfall, global warming",
          "Implementing solutions: enforcing Forestry Commission regulations, promoting alternative clean cooking fuels (LPG, biogas, solar cookers), community afforestation, agroforestry, gene banks"
        ],
        expectedStandard: "Causes and ecological consequences of deforestation evaluated and reforestation interventions implemented"
      }
    ]
  },
  {
    title: "4.3 AGRICULTURE IN ZAMBIA",
    generalCompetency: "Understand land tenure, traditional/commercial farming systems, irrigation, climate-smart agriculture, sugarcane (South Africa), and pastoralism (Botswana)",
    subtopics: [
      {
        title: "4.3.1 Land Tenure Systems",
        competencies: [
          "4.3.1.1 Analyse land tenure systems in Zambia: Customary/Traditional land vs State Land, leasehold titles, resource security, and dispute resolution"
        ],
        learningActivities: [
          "Contrasting Customary/Traditional Land (administered by Traditional Chiefs, no individual title deeds, allocated according to customary law) with State Land (administered by Ministry of Lands, 99-year leasehold title deeds, surveyed boundaries)",
          "Analysing implications: tenure security, securing commercial bank loans/collateral, land dispute resolution, titling customary land, and sustainable land stewardship"
        ],
        expectedStandard: "Customary and State land tenure systems analyzed and implications for agricultural investment evaluated"
      },
      {
        title: "4.3.2 Types of Farming in Zambia",
        competencies: [
          "4.3.2.1 Demonstrate understanding of farming in Zambia: traditional subsistence systems (chitemene, fonda, kuomboka mambwe), emergent farming, and large-scale commercial farming"
        ],
        learningActivities: [
          "Describing traditional farming systems: *Chitemene* slash-and-burn in Northern/Luapula, *Mambwe* grass-manure system, Lozi flood-recession farming in Barotse plains",
          "Contrasting Emergent smallholders (semi-commercial, surplus selling, oxen/small tractor mechanization) with Large-scale Commercial farming (high capital, heavy mechanization, irrigation pivots, hybrid seeds, chemical fertilizers, export focus)",
          "Analysing physical, economic, and infrastructure factors influencing farming distribution"
        ],
        expectedStandard: "Traditional, emergent, and commercial farming systems in Zambia compared and analyzed"
      },
      {
        title: "4.3.3 Irrigation Farming",
        competencies: [
          "4.3.3.1 Practise irrigation farming: methods (drip/trickle, overhead center-pivot, furrow/canal, treadle pumps), major irrigation schemes, and environmental impacts"
        ],
        learningActivities: [
          "Describing irrigation methods: modern drip irrigation (high water efficiency), overhead center-pivot sprinklers, furrow/basin flooding, manual treadle pumps",
          "Mapping major irrigation schemes: Nakambala Sugar Estate (Mazabuka), Chisamba, Mpongwe wheat scheme, Mkushi farm block, Kawambwa tea scheme, Mununshi banana scheme",
          "Evaluating environmental risks: soil salinization, waterlogging, leaching of nutrients, agrochemical water pollution, and waterborne bilharzia vector proliferation"
        ],
        expectedStandard: "Commercial irrigation schemes mapped, watering methods evaluated, and salinization risks managed"
      },
      {
        title: "4.3.4 Farming and Climate Change",
        competencies: [
          "4.3.4.1 Analyse relationship between farming and climate change: climate impacts on crop yields and adoption of Climate-Smart Agriculture (CSA)"
        ],
        learningActivities: [
          "Analysing how climate change disrupts agriculture: shortened growing seasons, mid-season dry spells, heat stress, new pest outbreaks (Fall Armyworm), soil degradation",
          "Executing Climate-Smart Agriculture (CSA): crop diversification, drought-resistant varieties, minimum tillage, organic manure use, precision water harvesting"
        ],
        expectedStandard: "Interactions between farming and climate change analyzed and Climate-Smart Agriculture practices implemented"
      },
      {
        title: "4.3.5 Sustainable and Unsustainable Farming",
        competencies: [
          "4.3.5.1 Practise sustainable farming (organic farming, agroforestry, crop rotation, soil conservation)",
          "4.3.5.2 Analyse unsustainable farming practices (overstocking, continuous monocropping, excessive chemical fertilizer usage, slopeward tilling)"
        ],
        learningActivities: [
          "Executing sustainable practices: legume crop rotation, organic mulching, biological pest management, agroforestry (*Faidherbia albida* / Musangu tree)",
          "Analysing unsustainable practices: overgrazing leading to soil compaction, continuous maize monoculture depleting nutrients, steep downhill plowing accelerating gully erosion"
        ],
        expectedStandard: "Sustainable farming practices applied and unsustainable agricultural degradations evaluated"
      },
      {
        title: "4.3.6 Sugarcane Growing in the Sub-Region (South Africa)",
        competencies: [
          "4.3.6.1 Relate sugar cane growing in South Africa to Zambia: climatic conditions, irrigation, processing, and economic trade linkages"
        ],
        learningActivities: [
          "Mapping sugarcane growing belts in South Africa (KwaZulu-Natal coastal belt, Mpumalanga Lowveld) and Zambia (Nakambala in Mazabuka, Kalungwishi in Luapula)",
          "Analysing growing conditions: high temperatures ($>21^\\circ\\text{C}$), abundant moisture/irrigation ($>1200\\text{ mm}$), fertile alluvial soils, sunny harvest ripening season, protective sugar trade tariffs",
          "Relating processing (sugar milling, molasses, ethanol biofuel) to economic growth in both nations"
        ],
        expectedStandard: "Sugarcane cultivation, irrigation, and processing in South Africa and Zambia compared accurately"
      },
      {
        title: "4.3.7 Pastoral Farming in the Sub-Region (Botswana)",
        competencies: [
          "4.3.7.1 Relate pastoral farming in Botswana to Zambia: semi-arid rangelands, cattle breeds, veterinary cordon disease control, Botswana Meat Commission (BMC), and beef exports"
        ],
        learningActivities: [
          "Mapping cattle ranching districts in Botswana (Ghanzi, Ngamiland, Kweneng, Central) and Zambia (Southern, Western, Central, Eastern provinces)",
          "Analysing factors favoring commercial beef production in Botswana: vast natural semi-arid pastures, hardy indigenous Tswana/Brahman breeds, borehole groundwater drilling, artificial insemination centers, strict veterinary cordon disease fences (FMD control), and the Botswana Meat Commission (BMC) export quota to the European Union (EU)",
          "Drawing lessons to upgrade Zambia's beef and dairy livestock sub-sectors"
        ],
        expectedStandard: "Commercial pastoral beef farming in Botswana analyzed and lessons applied to the Zambian livestock sector"
      },
      {
        title: "4.3.8 World Agriculture",
        competencies: [
          "4.3.8.1 Demonstrate knowledge of major types of farming in the world: shifting cultivation, plantation agriculture, intensive subsistence wet rice, Mediterranean farming, and commercial grain farming"
        ],
        learningActivities: [
          "Classifying major global agricultural systems: Shifting cultivation (tropical rainforests), Intensive subsistence wet rice (South/East Asia monsoon floodplains), Plantation agriculture (rubber, oil palm, coffee, tea, cocoa in tropics), Mediterranean agriculture (grapes, olives, citrus fruits), Commercial grain farming (wheat belts of North American Prairies, Eurasian Steppes), Extensive commercial livestock ranching (Pampas, Australian Outback)"
        ],
        expectedStandard: "Major global farming types, climatic characteristics, and geographical distribution demonstrated accurately"
      }
    ]
  },
  {
    title: "4.4 FISHING IN ZAMBIA",
    generalCompetency: "Analyze major Zambian fisheries, fishing/processing techniques, aquaculture, fisheries conservation, and comparative regional fisheries (Malawi & Zimbabwe)",
    subtopics: [
      {
        title: "4.4.1 Major Fisheries in Zambia",
        competencies: [
          "4.4.1.1 Demonstrate understanding of fisheries in Zambia: locating major natural fisheries, identifying commercial fish species, and fishing methods"
        ],
        learningActivities: [
          "Mapping major natural fisheries: Lake Kariba, Lake Bangweulu, Lake Tanganyika, Lake Mweru-Luapula, Lake Mweru-Wantipa, Kafue River/Flats, Lukanga Swamps, Upper Zambezi",
          "Identifying key commercial fish species: Lake Tanganyika Sardines (*Kapenta* / *Limnothrissa miodon*), Nile Perch (*Bukabuka*), Green-headed Bream (*Oreochromis macrochir*), Red-breasted Bream, Tigerfish, Catfish (*Vundu*), Barbel fish (*Mulonge*)",
          "Differentiating commercial methods (gill nets, purse seine ring nets with lights for Kapenta, longlining) from traditional artisanal methods (basket traps, spears, scoop nets)"
        ],
        expectedStandard: "Major Zambian natural fisheries mapped, commercial fish species identified, and fishing gear classified"
      },
      {
        title: "4.4.2 Methods of Fishing and Processing",
        competencies: [
          "4.4.2.1 Demonstrate understanding of fish processing: traditional sun-drying, hot-smoking, dry-salting, blast freezing, and cold chain logistics"
        ],
        learningActivities: [
          "Describing fish preservation methods: traditional open-air sun drying on raised racks, wood-smoking (kilns), heavy dry-salting, commercial blast freezing and ice-flaking",
          "Evaluating modern post-harvest packaging, refrigerated cold-chain transport, and sanitary hygiene inspection standards"
        ],
        expectedStandard: "Fish preservation and processing methods demonstrated and cold-chain distribution evaluated"
      },
      {
        title: "4.4.3 Fisheries Related Entrepreneurship",
        competencies: [
          "4.4.3.1 Practise fisheries related entrepreneurship: fish filleting, packaging smoked fish, establishing fish retail enterprises, and value addition"
        ],
        learningActivities: [
          "Analysing economic contributions: food and protein security, direct employment for fishermen and traders, foreign exchange, fish meal for animal feed",
          "Creating small-scale fisheries enterprises: processing value-added fish fillets, dried kapenta retail packaging, distribution logistics in local markets"
        ],
        expectedStandard: "Fisheries value addition and commercial entrepreneurship practices applied successfully"
      },
      {
        title: "4.4.4 Challenges and Solutions in Fishing",
        competencies: [
          "4.4.4.1 Provide solutions to fishing challenges: overfishing, destructive illegal fishing gear (mosquito nets, poisoning), water pollution, post-harvest losses, and annual fish bans"
        ],
        learningActivities: [
          "Examining challenges: overfishing depleting breeding stock, illegal small-mesh mosquito nets catching fingerlings, fish poisoning, water hyacinth weed clogging boats, seasonal post-harvest spoilage",
          "Formulating sustainable solutions: enforcing the annual national fish breeding ban (December 1 to March 1), mesh-size regulations, community co-management fishing committees, fish restocking, and promoting commercial fish farming"
        ],
        expectedStandard: "Fisheries challenges evaluated and sustainable regulatory/community management solutions provided"
      },
      {
        title: "4.4.5 Fish Farming (Aquaculture)",
        competencies: [
          "4.4.5.1 Practise fish farming (Aquaculture): pond construction, floating cage culture, water quality monitoring, fingerling restocking, and feeding management"
        ],
        learningActivities: [
          "Describing aquaculture methods: earthen dug-out fish ponds, floating lake cage culture (Lake Kariba, Lake Bangweulu, Lake Tanganyika), intensive circular concrete/plastic fish tanks",
          "Mapping major aquaculture districts: Siavonga (Kariba cage aquaculture), Chilanga, Mwekera (Kitwe), Kafue, Kasama",
          "Managing aquaculture operations: pond site selection, excavation, liming and fertilizing, fingerling stocking (Tilapia nilotica / three-spotted bream), formulated pellet feeding, dissolved oxygen/pH testing, harvesting"
        ],
        expectedStandard: "Fish farming methods, floating cage aquaculture, and pond management practices executed skillfully"
      },
      {
        title: "4.4.6 Fishing in the Sub-Region (Malawi)",
        competencies: [
          "4.4.6.1 Adopt fishing practices from Malawi: Lake Malawi fisheries, Chambo (*Oreochromis lidole*), Usipa, Utaka, and community-based fisheries conservation"
        ],
        learningActivities: [
          "Mapping major fisheries in Malawi: Lake Malawi (Lake Nyasa), Lake Malombe, Lake Chilwa, Shire River",
          "Identifying key commercial species: *Chambo* (endemic tilapia), *Usipa* (small sardine-like fish), *Utaka*, *Mpasa* (lake salmon), *Kampango* (catfish)",
          "Evaluating conservation initiatives: the Chambo Conservation Project, participatory community fisheries management (Beach Village Committees), closed breeding seasons, licensing commercial trawlers, gear mesh restrictions"
        ],
        expectedStandard: "Fisheries in Lake Malawi analyzed and sustainable conservation practices adopted"
      },
      {
        title: "4.4.7 Fish Farming in the Sub-Region (Zimbabwe)",
        competencies: [
          "4.4.7.1 Draw lessons of fish farming from Zimbabwe: Kariba aquaculture hubs, dam fisheries, commercial feed production, challenges, and export markets"
        ],
        learningActivities: [
          "Mapping aquaculture areas in Zimbabwe: Lake Kariba, Makoni, Mutasa, Chivi, Chiredzi, Masvingo",
          "Analysing supporting factors: favorable climate, abundant dams, commercial feed mills, private investment (Lake Harvest aquaculture)",
          "Evaluating challenges (water pollution, high feed costs, power outages) and solutions (climate-resilient breeds, renewable solar aeration, export market integration)"
        ],
        expectedStandard: "Commercial aquaculture practices and lessons drawn from Zimbabwe's fish farming industry"
      }
    ]
  },
  {
    title: "4.5 TOURISM IN ZAMBIA",
    generalCompetency: "Analyze domestic/international tourism in Zambia, sustainable ecotourism, tourism challenges, and comparative regional tourism (Kenya & South Africa)",
    subtopics: [
      {
        title: "4.5.1 Local and International Tourism",
        competencies: [
          "4.5.1.1 Demonstrate knowledge of tourism in Zambia: classifying domestic and international tourism, locating premier attractions, and analyzing economic benefits"
        ],
        learningActivities: [
          "Classifying tourism: Domestic (local Zambian residents traveling within the country) and International (foreign tourists visiting Zambia)",
          "Locating premier tourist attractions: Victoria Falls / *Mosi-oa-Tunya* (World Heritage site), South Luangwa National Park (walking safaris), Kafue National Park, Lower Zambezi, Kasanka bat migration, Bangweulu shoebill storks, traditional ceremonies (*Kuomboka, Nc'wala, Umutomboko*)",
          "Analysing economic benefits: foreign exchange earnings, direct/indirect employment (tour guides, lodge hospitality, transport), infrastructure modernization, handicraft markets, wildlife conservation funding"
        ],
        expectedStandard: "Premier tourist attractions in Zambia mapped and economic benefits of tourism demonstrated clearly"
      },
      {
        title: "4.5.2 Sustainable Tourism",
        competencies: [
          "4.5.2.1 Practise sustainable tourism: ecotourism, cultural heritage preservation, community-based natural resource management (CBNRM), and minimal environmental footprints"
        ],
        learningActivities: [
          "Defining sustainable ecotourism: responsible travel to natural areas that conserves the environment, respects local cultural heritage, and improves community livelihoods",
          "Practicing eco-friendly travel: staying in solar-powered eco-lodges, zero-littering in game parks, adhering to designated safari tracks, supporting local Community Resource Boards (CRBs)"
        ],
        expectedStandard: "Principles of sustainable ecotourism, community benefits, and environmental conservation practiced"
      },
      {
        title: "4.5.3 Challenges of Tourism and Solutions",
        competencies: [
          "4.5.3.1 Provide solutions to the challenges of tourism: poaching, seasonal tourism fluctuations, high lodge tariffs, infrastructure deficits, and aggressive global marketing"
        ],
        learningActivities: [
          "Analysing tourism challenges: poaching of wildlife trophies, seasonal rain road impassability, expensive domestic lodge rates, poor air connectivity, inadequate international brand marketing",
          "Evaluating solutions: community anti-poaching patrols (honorary wildlife rangers), airport and road infrastructure upgrades, encouraging affordable domestic tourism rates, aggressive digital promotion by Zambia Tourism Agency (ZTA)"
        ],
        expectedStandard: "Tourism challenges evaluated and comprehensive infrastructure, conservation, and marketing solutions provided"
      },
      {
        title: "4.5.4 Tourism in the Sub-Region (Kenya and South Africa)",
        competencies: [
          "4.5.4.1 Adopt best tourism practices from Kenya and South Africa: world-class coastal/wildlife infrastructure, private game ranching, and robust international marketing"
        ],
        learningActivities: [
          "Mapping major attractions: Kenya (Maasai Mara wildebeest migration, Amboseli, Mombasa coastal beaches, Fort Jesus) and South Africa (Kruger National Park, Table Mountain, Cape Winelands, Robben Island, Sun City, Garden Route)",
          "Analysing factors driving tourism success: world-class international airport hubs, developed Indian Ocean beach resort coastlines, private wildlife conservancies and game ranches, aggressive global branding campaigns ('Magical Kenya', 'South Africa: Inspiring New Ways')",
          "Drawing policy lessons to accelerate Zambia's tourism competitiveness"
        ],
        expectedStandard: "Best tourism development, marketing, and private conservancy practices adopted from Kenya and South Africa"
      }
    ]
  },
  {
    title: "4.6 FUEL AND ENERGY",
    generalCompetency: "Examine renewable/non-renewable energy, fuel transport logistics, Hydro-Electric Power (HEP) in Zambia, HEP vulnerability, and regional sub-region power pools",
    subtopics: [
      {
        title: "4.6.1 Fuel, Power and Energy in Zambia",
        competencies: [
          "4.6.1.1 Examine renewable and non-renewable energy sources: evaluating advantages and disadvantages of solar, wind, hydro, geothermal, biomass, coal, and petroleum",
          "4.6.1.2 Provide solutions to the challenges of transporting fuel and power: pipelines, bulk rail/road tankers, high-voltage transmission lines, and grid loss mitigation"
        ],
        learningActivities: [
          "Classifying energy sources: Renewable (solar PV, hydro-power, wind, geothermal at Kapisya/Lochinvar, biomass) vs Non-Renewable (Maamba coal, imported petroleum/diesel)",
          "Evaluating pros and cons: clean low-emission renewables vs intermittent solar/wind; high energy density fossil fuels vs carbon emissions and international price volatility",
          "Analysing fuel and power transport logistics: TAZAMA oil pipeline (Dar es Salaam to Indeni Ndola), road/rail fuel tankers, high-voltage transmission lines ($330\\text{ kV}$ grid), and managing transmission energy line losses"
        ],
        expectedStandard: "Energy sources evaluated and fuel/power transmission logistics and solutions analyzed"
      },
      {
        title: "4.6.2 Challenges and Solutions in Production of Energy",
        competencies: [
          "4.6.2.1 Address challenges in production of different types of energy (intermittent generation, high capital installation costs, grid integration, environmental pollution)"
        ],
        learningActivities: [
          "Analysing production challenges: heavy capital investment for solar plants/hydro dams, battery energy storage costs, coal pollution, drought-induced water shortages",
          "Formulating solutions: public-private partnerships (IPPs), deploying utility-scale Battery Energy Storage Systems (BESS), smart digital grid meters, and energy efficiency standards"
        ],
        expectedStandard: "Energy production constraints evaluated and sustainable diversification solutions formulated"
      },
      {
        title: "4.6.3 Hydro-Electric Power (HEP) in Zambia",
        competencies: [
          "4.6.3.1 Analyse hydro-electric power in Zambia: locating major HEP stations, physical/human siting factors, and environmental impacts of dam construction",
          "4.6.3.2 Adopt measures to reduce overdependence on HEP: climate drought vulnerability, loadshedding impacts, and aggressive renewable energy diversification"
        ],
        learningActivities: [
          "Mapping major HEP generation stations: Kariba North Bank ($1080\\text{ MW}$), Kafue Gorge Upper ($990\\text{ MW}$), Kafue Gorge Lower ($750\\text{ MW}$), Victoria Falls ($108\\text{ MW}$), Itezhi-Tezhi ($120\\text{ MW}$), Lusiwasi, Musonda Falls, Chishimba Falls",
          "Analysing ideal physical factors: large perennial water volume, steep river gradient/gorge for high hydraulic head, firm bedrock for dam foundation, deep narrow reservoir basin to minimize evaporation",
          "Assessing vulnerability of overdependence on HEP (drought-induced loadshedding) and executing energy diversification (scaling up solar farms e.g. Bangweulu/Ngonye, Maamba thermal coal, wind, and geothermal)"
        ],
        expectedStandard: "Zambian HEP generation stations mapped, siting factors analyzed, and energy diversification measures adopted"
      },
      {
        title: "4.6.4 Sustainable Energy",
        competencies: [
          "4.6.4.1 Use sustainable energy responsibly: promoting energy conservation, solar home lighting systems, energy-efficient appliances, and sustainable biomass harvesting"
        ],
        learningActivities: [
          "Practicing energy conservation: switching off non-essential lights, using energy-saving LED bulbs, installing domestic solar water geysers",
          "Analysing conditions for sustainable biomass: planting fast-growing firewood lots to match consumption and utilizing clean cookstoves (*chitetezo mbaula*)"
        ],
        expectedStandard: "Responsible use of sustainable energy and energy-efficient practices demonstrated"
      },
      {
        title: "4.6.5 Energy and Climate Change",
        competencies: [
          "4.6.5.1 Examine relationship between energy and climate change: fossil fuel greenhouse emissions vs clean renewable transition targets"
        ],
        learningActivities: [
          "Evaluating greenhouse gas emissions from coal, diesel generators, and petroleum combustion driving global climate disruptions",
          "Promoting national transition to net-zero renewable energy (solar, wind, hydro, green hydrogen)"
        ],
        expectedStandard: "Impact of energy production on climate change examined and clean energy transition championed"
      },
      {
        title: "4.6.6 HEP in the Sub-Region",
        competencies: [
          "4.6.6.1 Evaluate HEP in the Sub-Region: locating major stations (Cahora Bassa, Kariba, Inga Dam, Gariep/Vaal), Southern African Power Pool (SAPP), and regional power trading"
        ],
        learningActivities: [
          "Mapping major sub-regional HEP dams: Kariba Dam (Zambia/Zimbabwe), Cahora Bassa (Mozambique), Grand Inga / Inga I & II (DR Congo on Congo River), Gariep Dam (South Africa)",
          "Analysing the Southern African Power Pool (SAPP): regional interconnected transmission grid, cross-border electricity trading, wheeling power from surplus to deficit countries"
        ],
        expectedStandard: "Sub-regional hydro-electric power stations and SAPP cross-border electricity grid integration evaluated"
      }
    ]
  },
  {
    title: "4.7 MINING",
    generalCompetency: "Analyze mineral distribution, extraction/processing stages, economic contributions, mineral value chain opportunities, marketing routes, and comparative regional mining (Angola & South Africa)",
    subtopics: [
      {
        title: "4.7.1 Mining in Zambia",
        competencies: [
          "4.7.1.1 Demonstrate understanding of mining in Zambia: locating major mineral deposits (copper, cobalt, emeralds, coal, gold, manganese, nickel), geological factors, and interpreting production data"
        ],
        learningActivities: [
          "Mapping major mineral deposits: Copper and Cobalt (Copperbelt: Kitwe, Ndola, Mufulira, Chingola, Luanshya; North-Western 'New Copperbelt': Solwezi/Kansanshi, Lumwana, Kalumbila), Emeralds (Kafubu/Lufwanyama), Coal (Maamba), Lead and Zinc (Kabwe), Manganese (Mansa, Serenje), Nickel (Munali/Mazabuka), Gold (Rufunsa, Mumbwa), Limestone (Lusaka, Ndola)",
          "Analysing factors influencing mining: grade/purity of ore, depth and thickness of mineral seams, transport infrastructure, global London Metal Exchange (LME) copper prices, government mining tax policies",
          "Interpreting mineral production and export tables, bar charts, and trends"
        ],
        expectedStandard: "Major Zambian mineral deposits mapped and physical/economic determinants of mining understood clearly"
      },
      {
        title: "4.7.2 Mineral Processing and Economic Growth in Zambia",
        competencies: [
          "4.7.2.1 Relate mineral processing to economic growth in Zambia: extraction stages (blasting, crushing, froth flotation, smelting, electrolytic refining) and macroeconomic contributions"
        ],
        learningActivities: [
          "Describing mineral processing stages: underground/open-cast blasting $\\to$ primary/secondary crushing $\\to$ ball mill grinding $\\to$ froth flotation (producing 30% copper concentrate) $\\to$ reverberatory smelting (producing blister copper) $\\to$ electrolytic refining (producing 99.99% pure cathode copper)",
          "Evaluating economic contributions: contributing ~70% of foreign exchange earnings, Gross Domestic Product (GDP), corporate tax revenues, direct/indirect formal employment, infrastructure development in mining towns"
        ],
        expectedStandard: "Mineral extraction and metallurgical refining stages described and macroeconomic contributions evaluated"
      },
      {
        title: "4.7.3 Uses of Major Minerals",
        competencies: [
          "4.7.3.1 Use opportunities within Zambia's mineral value chain: industrial applications of copper, cobalt, lead, zinc, and coal, and domestic value addition"
        ],
        learningActivities: [
          "Classifying mineral uses: Copper (electrical cables, generators, plumbing pipes, brass/bronze alloys, roofing, electric vehicles), Cobalt (lithium-ion battery cathodes, jet engine superalloys), Coal (thermal electricity, cement kilns, smelters), Limestone (cement, agricultural lime)",
          "Exploring local value-addition manufacturing opportunities: copper cable drawing plants (ZAMEFA in Luanshya), battery manufacturing, localized metal fabrication"
        ],
        expectedStandard: "Industrial uses of minerals identified and value-addition manufacturing opportunities utilized"
      },
      {
        title: "4.7.4 Marketing of Major Minerals",
        competencies: [
          "4.7.4.1 Provide solutions to challenges Zambia faces in mineral markets: export international destinations, export transport transit corridors, price fluctuations, and strategic hedging"
        ],
        learningActivities: [
          "Identifying primary export markets: China, India, European Union, Japan, USA, UAE",
          "Tracing export transport corridors: Dar es Salaam corridor (via TAZARA rail / road to Tanzania port), Beira and Maputo corridors (Mozambique), Durban and Port Elizabeth corridors (South Africa), Lobito corridor (via Benguela rail to Angola Atlantic port)",
          "Formulating solutions to market challenges: commodity price hedging, local processing into finished copper goods, developing regional trade under AfCFTA, infrastructure modernization"
        ],
        expectedStandard: "Mineral export markets and oceanic transit corridors traced and international commodity market solutions provided"
      },
      {
        title: "4.7.5 Mining in the Sub-Region (Angola and South Africa)",
        competencies: [
          "4.7.5.1 Draw lessons of mining from Angola and South Africa: petroleum/diamond extraction in Angola, gold/platinum/diamond mining in South Africa, environmental reclamation, and sovereign wealth funds"
        ],
        learningActivities: [
          "Mapping mineral belts: Angola (offshore Cabinda crude petroleum, diamonds in Lunda Norte/Sul) and South Africa (Witwatersrand gold basin, Bushveld platinum/chromium complex, Kimberley diamonds, Highveld coal)",
          "Analysing environmental impacts (mine tailing acid drainage, sinkholes, dust pollution, deforestation) and mitigation policies (land reclamation, strict environmental mining audits, sovereign wealth reinvestment funds)"
        ],
        expectedStandard: "Sub-regional mining industries in Angola and South Africa analyzed and environmental reclamation lessons drawn"
      }
    ]
  },
  {
    title: "4.8 MANUFACTURING AND PROCESSING INDUSTRIES",
    generalCompetency: "Analyze Zambian manufacturing/processing industries, industrial location factors, environmental impacts, sub-regional industries (Zimbabwe & South Africa), and industrial lessons from Japan & China",
    subtopics: [
      {
        title: "4.8.1 Manufacturing and Processing Industries in Zambia",
        competencies: [
          "4.8.1.1 Examine major processing and manufacturing industries in Zambia: heavy vs light industries, spatial location factors, and economic importance"
        ],
        learningActivities: [
          "Classifying industries: Primary / Processing (raw agricultural/mineral processing: grain milling, cotton ginning, sawmills, copper smelting) and Secondary / Manufacturing (Heavy industries: cement production at Chilanga/Ndola, vehicle assembly, chemical fertilizers at Kafue; Light industries: food processing, beverages, textiles, plastics, pharmaceuticals in Lusaka, Ndola, Kitwe)",
          "Analysing industrial location factors: raw material proximity, reliable power supply, clean industrial water, market demand, transport networks, skilled labor",
          "Evaluating economic importance: import substitution, value addition, job creation, GDP growth, stimulating regional trade"
        ],
        expectedStandard: "Manufacturing and processing industries in Zambia classified, mapped, and location factors examined"
      },
      {
        title: "4.8.2 Challenges in Processing and Manufacturing Industries",
        competencies: [
          "4.8.2.1 Provide solutions to challenges in processing and manufacturing industries: high production costs, foreign competition, power outages, environmental pollution, and industrial greening"
        ],
        learningActivities: [
          "Analysing industrial challenges: high cost of imported machinery and raw materials, competition from cheap imported manufactured goods, intermittent electricity supply, skills gap",
          "Evaluating environmental impacts: industrial air pollution ($SO_2$ emissions), untreated liquid effluent discharge into Kafue/Mwambashi rivers, solid industrial waste",
          "Formulating solutions: establishing Special Economic Zones (Multi-Facility Economic Zones - MFEZ in Lusaka, Chambishi, Lumwana), tax incentives for local producers, industrial wastewater recycling, green clean technologies"
        ],
        expectedStandard: "Industrial challenges and environmental pollution evaluated and sustainable manufacturing solutions provided"
      },
      {
        title: "4.8.3 Manufacturing and Processing Industries in Sub-Region (Zimbabwe and South Africa)",
        competencies: [
          "4.8.3.1 Analyse manufacturing and processing industries in Zimbabwe and South Africa: heavy iron and steel complexes, motor vehicle assembly, and cross-border manufactured trade"
        ],
        learningActivities: [
          "Mapping major industrial centers: South Africa (Gauteng / PWV industrial complex: iron and steel at Vanderbijlpark, motor vehicle assembly in Pretoria, Port Elizabeth, Durban; chemicals at Sasolburg) and Zimbabwe (iron and steel at Redcliff/Kwekwe, food processing in Harare, Bulawayo)",
          "Analysing trade direction and volume: export of machinery, vehicles, processed food, and chemicals from South Africa to regional SADC markets"
        ],
        expectedStandard: "Heavy manufacturing and automotive industries in South Africa and Zimbabwe analyzed and regional trade flows mapped"
      },
      {
        title: "4.8.4 Manufacturing Industries in the World (Japan and China)",
        competencies: [
          "4.8.4.1 Draw lessons from rapid industrial expansion in Japan and China: advanced automation, robotics, export-oriented manufacturing, solar/EV green technologies, and state strategic planning"
        ],
        learningActivities: [
          "Analysing Japan's industrial miracle: post-WWII reconstruction, Keiretsu collaboration, highly skilled educated labor, Total Quality Management (Kaizen), advanced robotics and automotive leadership (Toyota, Honda, Sony) despite lacking domestic raw materials",
          "Analysing China's rapid manufacturing expansion: Special Economic Zones (Shenzhen, Pudong), abundant skilled workforce, massive infrastructure investment, low production costs, global leadership in renewable solar panels, lithium batteries, and electric vehicles (EVs)",
          "Drawing strategic industrial policy lessons for Zambian economic transformation"
        ],
        expectedStandard: "Factors driving industrial leadership in Japan and China analyzed and strategic manufacturing lessons drawn"
      }
    ]
  },
  {
    title: "4.9 TRANSPORT AND COMMUNICATION",
    generalCompetency: "Analyze transport and communication modes in Zambia, environmental impacts, sustainable mobility, landlocked regional trade corridors, and modern technological trends",
    subtopics: [
      {
        title: "4.9.1 Transport and Communication in Zambia",
        competencies: [
          "4.9.1.1 Demonstrate understanding of transport and communication in Zambia: modes (road, rail, air, water, pipeline), telecommunications (fiber-optic, satellite, mobile networks), challenges, and solutions"
        ],
        learningActivities: [
          "Classifying transport modes: Road (tarred highways e.g. T2 Great North Road, T4 Great East Road), Rail (Zambia Railways, TAZARA line), Air (Kenneth Kaunda, Simon Mwansa Kapwepwe, Harry Mwaanga Nkumbula international airports), Water (Lake Tanganyika Mpulungu port, Zambezi pontoons/ferries), Pipeline (TAZAMA oil pipeline)",
          "Classifying communication modes: mobile telephony, optical fiber broadband networks, satellite communications, digital media",
          "Analysing infrastructure challenges (potholes, railway derailments, high freight costs, digital connectivity divides) and evaluating public-private partnership (PPP) upgrade solutions"
        ],
        expectedStandard: "Modes of transport and communication in Zambia mapped, challenges analyzed, and infrastructure solutions proposed"
      },
      {
        title: "4.9.2 Environmental Impact of Different Forms of Transport",
        competencies: [
          "4.9.2.1 Analyse environmental impacts of different forms of transport: fossil fuel greenhouse emissions, noise pollution, roadkill, and battery disposal"
        ],
        learningActivities: [
          "Analysing environmental consequences: vehicular exhaust emissions ($CO_2, NO_x$, particulate matter) driving photochemical smog and global warming, deforestation for road construction, oil spills from water transport, end-of-life battery disposal concerns",
          "Comparing transport carbon footprints: rail vs road freight, public buses vs single-occupancy private cars"
        ],
        expectedStandard: "Environmental and carbon footprint impacts of different transport modes analyzed objectively"
      },
      {
        title: "4.9.3 Sustainable Mobility in Zambia",
        competencies: [
          "4.9.3.1 Adopt sustainable mobility practices: non-motorized transport (walking, cycling), mass transit public buses, electric vehicles (EVs), and urban green transport corridors"
        ],
        learningActivities: [
          "Evaluating sustainable mobility modes: non-motorized transport (dedicated pedestrian walkways, bicycle lanes), mass rapid bus transit (BRT), electric commuter buses, electric motorbikes",
          "Analysing advantages (reduced air and noise pollution, lower running costs, improved cardiovascular public health) vs challenges (high upfront capital costs, charging station infrastructure deficits)",
          "Advocating for personal and community adoption of sustainable mobility practices"
        ],
        expectedStandard: "Sustainable urban mobility, mass transit, and electric vehicle adoption practices evaluated and championed"
      },
      {
        title: "4.9.4 Transport and Communication in the Sub-Region",
        competencies: [
          "4.9.4.1 Analyse efforts to improve transport and communication in landlocked countries: transforming from landlocked to 'land-linked', regional trade corridors (North-South, Walvis Bay, Dar es Salaam, Beira, Lobito), and One-Stop Border Posts (OSBP)"
        ],
        learningActivities: [
          "Analysing the strategic transformation of landlocked countries (Zambia, Zimbabwe, Malawi, Botswana, Rwanda) into vibrant land-linked transit hubs",
          "Mapping regional economic transit corridors: North-South Corridor (Durban to DRC), Walvis Bay-Ndola-Lubumbashi Development Corridor (WBNLDC via Trans-Caprivi), Dar es Salaam Corridor, Beira Corridor, Lobito Corridor",
          "Evaluating trade facilitation benefits: One-Stop Border Posts (OSBP at Chirundu, Kazungula, Nakonde, Kasumbalesa) slashing transit clearance times, boosting cross-border SADC trade, and reducing transport costs"
        ],
        expectedStandard: "Regional transit corridors and One-Stop Border Post trade facilitation in landlocked countries analyzed comprehensively"
      },
      {
        title: "4.9.5 World Transport and Communication",
        competencies: [
          "4.9.5.1 Demonstrate understanding of new trends in transport and communication: Artificial Intelligence (AI) in logistics, high-speed rail networks, autonomous electric vehicles, smart digital logistics, and 5G telecommunications"
        ],
        learningActivities: [
          "Examining modern global technological trends: containerized mega-shipping vessels (Suez and Panama canal routes), high-speed bullet trains (Shinkansen in Japan, CRH in China), autonomous electric vehicles, drone delivery logistics, Artificial Intelligence (AI) for traffic optimization, global satellite internet constellations (Starlink), and 5G fiber networks",
          "Evaluating how modern digital logistics transforms global supply chains and economic productivity"
        ],
        expectedStandard: "Modern global technological trends in automated transport, logistics, and digital communications demonstrated"
      }
    ]
  }
];
