import { Topic } from './syllabi';

export const obcPhysicsGrade10: Topic[] = [
  {
    title: "10.1 General Physics",
    generalCompetency: "Understand physical quantities, apply the International System of Units (SI) with standard prefixes and scientific notation, measure length and time intervals with precision, and evaluate the concepts of mass, weight, center of mass, stability, and density.",
    subtopics: [
      {
        title: "10.1.1 International System of Units (SI)",
        competencies: [
          "Distinguish between basic and derived quantities",
          "Identify basic units and derived units",
          "Recognise prefixes, multiples and submultiples of fundamental and derived units",
          "Use scientific notation and significant figures in numerical problems"
        ],
        knowledge: "Physical quantities as measurable properties of nature. Classification into basic quantities (independent, e.g., length in metres, mass in kilograms, time in seconds, thermodynamic temperature in Kelvin) and derived quantities (combinations of basic quantities, e.g., force in Newtons, velocity in metres per second, acceleration in metres per square second). Standard SI units and symbols. Prefix multipliers and submultiples (e.g., giga [G, 10^9], mega [M, 10^6], kilo [k, 10^3], deci [d, 10^-1], centi [c, 10^-2], milli [m, 10^-3], micro [µ, 10^-6], nano [n, 10^-9]). Expression of physical measurements in scientific notation (standard form, A x 10^n) and appropriate rounding using significant figures based on instrument precision.",
        skills: "Classifying physical quantities, identifying appropriate SI prefixes, converting between units, applying significant figures and scientific notation in calculation",
        values: "Precision in numerical representation, scientific curiosity, critical analysis of physical dimensions",
        learningActivities: [
          "Comparing physical quantities to classify them into basic (length, mass, time, temperature) and derived (force, velocity, area, volume)",
          "Listing SI units for fundamental and derived quantities, identifying prefix multipliers, and practicing unit conversions",
          "Solving mathematical physics problems, expressing answers in standard form, and justifying the number of significant figures used"
        ],
        expectedStandard: "Basic and derived physical quantities and their SI units are correctly distinguished, prefix conversions are executed accurately, and scientific notation is applied with appropriate significant figures."
      },
      {
        title: "10.1.2 Length and Time",
        competencies: [
          "Demonstrate the use of various measuring instruments to determine length",
          "Demonstrate the use of clocks and devices for measuring an interval of time",
          "Identify factors that affect the period of a simple pendulum"
        ],
        knowledge: "Measurement of length using appropriate instruments based on size and required accuracy: metre rules (nearest mm, ranges 10 cm - 1 m), vernier callipers (nearest 0.1 mm or 0.02 mm, for internal/external diameters of tubes), and micrometer screw gauges (nearest 0.01 mm, for thin wires or sheets). Measurement of time intervals using stopclocks, stopwatches, and digital clocks. The simple pendulum: period (T) as the time taken to complete one full oscillation. Experimental determination of the factors affecting the period of a simple pendulum: length of the pendulum string (T increases as length increases) and amplitude (independent of period for small angles).",
        skills: "Operating vernier callipers and micrometer screw gauges, recording time intervals, setting up a pendulum experiment, controlling variables",
        values: "Appreciation of measurement tools, care and accuracy in observing physical oscillations, team cooperation",
        learningActivities: [
          "Using metre rules, vernier callipers, and micrometer screw gauges to measure the physical dimensions of various lab objects and comparing their precision",
          "Measuring time intervals of multiple events using stopwatches and calculating average intervals to minimize human reaction error",
          "Conducting an investigation with a simple pendulum to plot period squared (T^2) against length (L) and analyzing factors like string length and angular amplitude"
        ],
        expectedStandard: "Lengths and time intervals are measured with high precision using standard instruments, and the factors affecting the period of a simple pendulum are experimentally identified and explained."
      },
      {
        title: "10.1.3 Mass and Weight",
        competencies: [
          "Distinguish between mass and weight",
          "Demonstrate how to measure mass and weight",
          "Demonstrate how to locate the centre of mass of an object",
          "Describe qualitatively the effect of the position of the centre of mass on the stability of an object"
        ],
        knowledge: "Mass as the amount of matter in a body, a scalar quantity measured in kilograms using a triple-beam or electronic balance (constant regardless of location). Weight as the gravitational force acting on a body, a vector quantity measured in Newtons using a spring balance (varies with gravitational field strength, W = mg). Centre of mass as the single point through which the entire mass of an object appears to be concentrated. Locating the centre of mass of an irregularly shaped flat object (lamina) using a plumbline, pin, and stand. Stability of objects: stable, unstable, and neutral equilibrium. Factors affecting stability: base area of the object (wider base increases stability) and the height of the centre of mass (lower centre of mass increases stability).",
        skills: "Using balances to determine mass and weight, locating centres of mass of regular and irregular laminae, communicating stability conditions",
        values: "Precision, appreciation of design structures for stability in daily transport and construction",
        learningActivities: [
          "Comparing mass and weight of various objects using triple-beam balances and spring balances under different loading conditions",
          "Locating the centre of mass of irregular cardboard sheets (laminae) by suspending them from different points alongside a plumbline and marking the intersection of the vertical lines",
          "Investigating the tipping angle of cylinders with varying base widths and water heights to analyze stable, unstable, and neutral equilibrium states"
        ],
        expectedStandard: "Mass and weight are clearly distinguished in terms of units, measurement tools, and physical properties; centres of mass are located experimentally, and stability factors are qualitatively evaluated."
      },
      {
        title: "10.1.4 Density",
        competencies: [
          "Determine the density of floating objects",
          "Determine the density of a mixture of liquids",
          "Describe what relative density is",
          "Calculate relative density of air"
        ],
        knowledge: "Density (ρ) as mass per unit volume (ρ = m/V). Finding the density of floating objects (e.g., cork) by using a sinker to submerge them in a displacement can/measuring cylinder. Finding the density of a mixture of miscible liquids: total mass divided by total volume (ρ_mix = (m1 + m2) / (V1 + V2)). Relative density as the ratio of the density of a substance to the density of water (unitless quantity, R.D. = ρ_substance / ρ_water). Relative density of air: mass of a known volume of air (evacuated flask method) compared to the mass of an equal volume of water.",
        skills: "Measuring liquid volume and solid mass, implementing sinker methods for displacement, calculating mixture densities, computing relative density",
        values: "Attention to detail, cooperation in wet laboratory experiments, resource conservation",
        learningActivities: [
          "Determining the volume of a floating cork using a displacement can, a measuring cylinder, and a heavy metal sinker to calculate its density",
          "Mixing water and alcohol in specific volume ratios, measuring the resultant mass and volume, and calculating the density of the liquid mixture",
          "Calculating relative densities of various metals and fluids, and discussing why relative density has no units"
        ],
        expectedStandard: "The densities of floating materials and liquid mixtures are determined experimentally, and relative density calculations, including that of air, are performed accurately."
      }
    ]
  },
  {
    title: "10.2 Mechanics",
    generalCompetency: "Analyze and resolve vector quantities, solve problems of uniformly accelerated motion, explain linear dynamics using Newton's laws, model spring behaviors using Hooke's law, apply the principle of moments, evaluate work, energy, power, and simple machines, and calculate fluid and atmospheric pressure.",
    subtopics: [
      {
        title: "10.2.1 Scalars and Vectors",
        competencies: [
          "Describe what scalar and vector quantities are",
          "Identify scalars and vector quantities",
          "Demonstrate adding of vectors to determine a resultant",
          "Demonstrate how to determine the resultant of two vectors graphically"
        ],
        knowledge: "Scalars as physical quantities having magnitude only (e.g., distance, speed, mass, time, temperature, energy, power, density). Vectors as physical quantities having both magnitude and direction (e.g., displacement, velocity, acceleration, force, weight, momentum, magnetic field). Vector representation using arrows (length shows magnitude, arrowhead shows direction). Addition of linear vectors: algebraic sum for parallel vectors (F_R = F1 + F2) or difference for antiparallel vectors (F_R = F1 - F2). Addition of non-linear vectors: finding resultants graphically using the parallelogram of vectors law and the triangle law of vectors with appropriate scaling.",
        skills: "Classifying physical parameters as scalar or vector, drawing scaled vector diagrams, calculating resultant forces, resolving horizontal and vertical components",
        values: "Logical reasoning, appreciation of graphical modeling, precision in scale drawing",
        learningActivities: [
          "Sorting a list of physical variables into scalar and vector categories and justifying the sorting based on directional dependencies",
          "Using force boards, weights, and strings to establish static equilibrium, then drawing scaled parallelogram vectors on paper to find the resultant and compare with experimental values"
        ],
        expectedStandard: "Scalar and vector quantities are correctly categorized, and resultants of two vectors are resolved both algebraically (linear) and graphically using scaled diagrams."
      },
      {
        title: "10.2.2 Linear Motion",
        competencies: [
          "Describe the terms used in mechanics",
          "Demonstrate the use of equations of uniformly accelerated motion to solve problems",
          "Interpret graphical representation of distance-time, displacement-time, speed-time, velocity-time, and acceleration-time",
          "Investigate the consequences of overspeeding",
          "Describe the acceleration of free fall for a body near the earth",
          "Describe qualitatively the motion of bodies falling in a uniform gravitational field with and without air resistance"
        ],
        knowledge: "Kinematic terms: distance (scalar path length) vs. displacement (vector straight-line distance with direction), speed (scalar rate of distance) vs. velocity (vector rate of displacement), acceleration (rate of change of velocity). Equations of uniformly accelerated motion: v = u + at; s = (u + v)t / 2; s = ut + 0.5at^2; v^2 = u^2 + 2as. Graphical analysis: gradient of displacement-time graph equals velocity; gradient of velocity-time graph equals acceleration; area under velocity-time graph equals displacement. Gravitational acceleration near Earth as a constant (g ≈ 10 m/s^2). Falling bodies: in a vacuum, all bodies fall with equal constant acceleration g; in air, air resistance increases with speed until it equals weight, leading to zero acceleration and a constant terminal velocity. Overspeeding dynamics: relation to stopping distance (thinking distance + braking distance), brake failure, tire friction, and crash impacts.",
        skills: "Interpreting slopes and areas of motion graphs, executing calculations using equations of motion, communicating the physical mechanism of terminal velocity, analyzing stopping distances",
        values: "Road safety awareness, appreciation of physical limits of transport, scientific integrity in recording kinematic data",
        learningActivities: [
          "Solving mathematical problems of uniform acceleration (e.g., braking cars, falling stones) using kinematic equations",
          "Constructing and interpreting velocity-time graphs using ticker-tape timers or electronic motion sensors for objects rolling down inclined planes",
          "Discussing the motion of a skydiver with and without a parachute to model the changes in forces, net acceleration, and terminal velocity"
        ],
        expectedStandard: "Kinematic calculations using the four equations of motion are resolved accurately, motion graphs are plotted and interpreted, and free-fall dynamics (including air resistance and terminal velocity) are explained."
      },
      {
        title: "10.2.3 Forces",
        competencies: [
          "Explain what force is",
          "Explain the effect of forces on bodies",
          "Describe the inertia law",
          "Demonstrate the relationship between force and acceleration",
          "Demonstrate the relationship between mass and acceleration",
          "Perform calculations on force",
          "Investigate the effect of force on a spring",
          "Demonstrate the effects of friction on the motion of a body",
          "Describe the motion in a circular path due to a perpendicular force"
        ],
        knowledge: "Force defined as a pull or a push acting on an object, measured in Newtons (N). Effects of forces: change in shape, size, speed, or direction of motion. Newton's First Law of Motion (Inertia Law): a body remains at rest or in uniform motion in a straight line unless acted upon by a net external force; inertia is proportional to mass. Newton's Second Law: acceleration is directly proportional to net force and inversely proportional to mass (F = ma; constant force produces constant acceleration). Newton's Third Law: action and reaction forces are equal and opposite. Elasticity: Hooke's Law (F = ke, force is proportional to extension within the limit of proportionality; spring constant k). Friction: force opposing motion, causing wear and tear and generating heat. Circular motion: centripetal force acts perpendicular to velocity, directed towards the centre of the path (F_c = mv^2/r), maintaining circular orbit; centrifugal force as an apparent outward reaction.",
        skills: "Calculating force, mass, and acceleration; plotting Hooke's law graphs and determining spring constants; investigating static and kinetic friction; describing centripetal dynamics",
        values: "Safety in vehicle belt design (inertia protection), appreciation of elastic materials, cooperation in group experiments",
        learningActivities: [
          "Investigating Newton's second law by varying masses on a trolley pulled by constant falling weights and measuring acceleration using ticker tape",
          "Hanging slotted weights on a spiral spring, measuring corresponding extensions, plotting force-extension graphs, and identifying the limit of proportionality",
          "Measuring the force required to pull wooden blocks across various surfaces (sandpaper, wood, glass) to evaluate friction coefficients",
          "Demonstrating circular motion by whirling a rubber bung on a string and discussing how the tension provides the centripetal force"
        ],
        expectedStandard: "Newton's laws of motion are applied to solve quantitative dynamical problems, Hooke's law is verified graphically with spring constants calculated, and friction and circular motion forces are analyzed."
      },
      {
        title: "10.2.4 Moment of Forces",
        competencies: [
          "Perform calculations based on the principle of moments",
          "Investigate the everyday application of moments"
        ],
        knowledge: "Moment of a force as the turning effect of a force about a pivot, defined as force multiplied by the perpendicular distance from the pivot (Moment = F x d). Principle of Moments: for an object in rotational equilibrium, the sum of clockwise moments about any point must equal the sum of anticlockwise moments about that same point. Conditions for complete static equilibrium: net force equals zero (sum of F = 0) and net moment equals zero (sum of moments = 0). Everyday applications: doors, windows, see-saws, crowbars, bottle openers, and tightening bolts with spanners (longer spanner handles reduce the effort force needed by increasing perpendicular distance).",
        skills: "Experimentally balancing a loaded beam, calculating unknown masses and distances using moment equations, justifying architectural balance designs",
        values: "Critical thinking, structural appreciation of simple tools, team collaboration in physical trials",
        learningActivities: [
          "Balancing a uniform metre rule on a knife-edge pivot with different weights suspended on either side to verify that clockwise moments equal anticlockwise moments",
          "Solving mathematical problems involving non-uniform beams, scaffolds, and levers by taking moments about a selected pivot point",
          "Investigating how varying the position of a load on a wheelbarrow or the handle length of a spanner changes the mechanical effort required"
        ],
        expectedStandard: "The principle of moments is verified and applied to solve quantitative static equilibrium problems, and the structural advantages of torque are justified."
      },
      {
        title: "10.2.5 Work, Energy and Power",
        competencies: [
          "Explain the meaning of the terms work, energy and power",
          "Identify the units of measurement for work, energy and power",
          "Calculate work using the appropriate formula",
          "Identify the different forms of energy",
          "Explain qualitatively and quantitatively the terms gravitational potential and kinetic energy",
          "Describe sources of renewable and non-renewable energy",
          "Explain the effects of the use of energy sources on the environment",
          "Demonstrate energy transformation from one form to another",
          "Describe the conservation of energy",
          "Demonstrate the calculation of efficiency of energy conversion using the appropriate formula",
          "Demonstrate calculation of power using the appropriate formula"
        ],
        knowledge: "Work (W) as the product of force and the distance moved in the direction of the force (W = F x d, unit: Joule [J]). Energy as the capacity to do work (unit: Joule [J]). Power (P) as the rate of doing work or transferring energy (P = W / t = E / t, unit: Watt [W]). Forms of energy: mechanical (kinetic, potential), thermal, chemical, electrical, nuclear, solar, light, sound. Kinetic Energy (E_k = 0.5mv^2, energy due to motion). Gravitational Potential Energy (E_p = mgh, energy due to position in a gravitational field). Energy resources: renewable (solar, wind, hydroelectric, geothermal, biomass) vs. non-renewable (coal, oil, natural gas, nuclear). Environmental impact: air pollution, acid rain, greenhouse effect, global warming, deforestation. Law of Conservation of Energy: energy cannot be created or destroyed, only transformed from one form to another. Efficiency of a system: (useful energy output / total energy input) x 100%.",
        skills: "Calculating work, power, kinetic energy, potential energy, and energy efficiency; mapping energy transformation pathways; evaluating environmental impacts of energy fuels",
        values: "Environmental stewardship, appreciation of clean renewable energy, safety in electrical power consumption",
        learningActivities: [
          "Measuring the time taken to run up a flight of stairs, recording body weight, and calculating the mechanical work done and power developed",
          "Conducting experiments with falling masses to demonstrate the interconversion of gravitational potential energy and kinetic energy",
          "Creating flowcharts representing energy transformations in household appliances (e.g., batteries, light bulbs, electric kettles)",
          "Researching local hydro plants (e.g., Kariba Dam) to analyze efficiency and environmental impacts of regional power generation"
        ],
        expectedStandard: "Work, energy, power, and efficiency are calculated accurately using standard physical formulas, and the principles of conservation of energy and environmental impacts of energy sources are evaluated."
      },
      {
        title: "10.2.6 Simple Machines",
        competencies: [
          "Describe what a simple machine is",
          "Identify the different types of simple machines",
          "Describe the distances moved by the effort and the load in a simple machine",
          "Explain the terms of Mechanical advantage (MA), Velocity Ratio (VR) and Efficiency",
          "Perform calculations involving simple machines"
        ],
        knowledge: "A simple machine as a device that allows a large force (load) to be overcome by a smaller force (effort). Types of simple machines: levers, pulleys, gears, inclined planes, screws, wheel and axle. Effort distance (d_e) vs. load distance (d_l). Mechanical Advantage (MA) as the ratio of load to effort (MA = Load / Effort). Velocity Ratio (VR) as the ratio of distance moved by effort to distance moved by load in the same time (VR = d_e / d_l). Efficiency (η) as the ratio of useful work output to total work input, which equals (MA / VR) x 100%. Due to friction and the weight of moving parts, efficiency is always less than 100%.",
        skills: "Identifying simple machines, measuring effort and load displacements, calculating MA, VR, and efficiency for single and multiple pulley systems and inclined planes",
        values: "Appreciation of mechanical design in reducing physical strain, precision, logical analysis",
        learningActivities: [
          "Setting up single fixed, single movable, and block-and-tackle pulley systems to measure actual loads and efforts, calculating mechanical advantages and comparing with theoretical velocity ratios",
          "Measuring the slope length and vertical height of an inclined plane to determine its VR, pulling a trolley up the slope to find its MA, and calculating its efficiency"
        ],
        expectedStandard: "The mechanical principles of simple machines are explained, and mechanical advantage, velocity ratio, and efficiency are computed and compared across different machine configurations."
      },
      {
        title: "10.2.7 Pressure",
        competencies: [
          "Explain what pressure is",
          "Describe how pressure relates to force and area using appropriate examples and formula",
          "Identify factors affecting pressure in liquids",
          "Describe the transmission of pressure in hydraulic systems",
          "Calculate pressure in liquids",
          "Explain the mechanism of a mercury barometer",
          "Explain the mechanism of a manometer",
          "Explain principles of upthrust and floatation",
          "Describe how upthrust relate to floatation in fluids"
        ],
        knowledge: "Pressure (P) defined as force per unit area acting normally on a surface (P = F / A). Units of pressure: Pascal (Pa = 1 N/m^2), millibars, and mmHg. Relationship: larger surface area reduces pressure for the same force (e.g., snowshoes, wide tires, elephant feet); smaller area concentrates pressure (e.g., needles, knife edges, stiletto heels). Liquid pressure: acts in all directions, increases with depth and density of the liquid, independent of container shape (formula: p = ρgh). Pascal's Principle: pressure applied to an enclosed fluid is transmitted equally to all parts of the fluid (e.g., hydraulic jacks, hydraulic car brakes). Atmospheric pressure measurement: the mercury barometer. Gas pressure measurement: the U-tube manometer. Upthrust and Floatation: Archimedes' Principle states that a body immersed in a fluid experiences an upward force (upthrust) equal to the weight of the fluid displaced. Principle of Floatation: a floating object displaces its own weight of fluid.",
        skills: "Calculating solid and liquid pressures, describing hydraulic multiplication, interpreting mercury heights in barometers and liquid levels in manometers, applying Archimedes' principle to solve buoyancy problems",
        values: "Precision, safety in high-pressure fluid environments, curiosity about aquatic floatation and weather barometric changes",
        learningActivities: [
          "Measuring the dimensions and weight of a rectangular block to calculate the maximum and minimum pressures it exerts on a surface based on orientation",
          "Using a plastic bottle with holes at different heights to observe water jet ranges, demonstrating that liquid pressure increases with depth",
          "Demonstrating the Cartesian diver or measuring the upthrust on a metal cylinder submerged in water to verify Archimedes' principle",
          "Reading local weather atmospheric pressures using a barometer and calculating gas pressures using U-tube manometers connected to gas supplies"
        ],
        expectedStandard: "Solid pressure, hydrostatic liquid pressure, and gas pressure are calculated accurately using standard equations; the mechanisms of barometers, manometers, hydraulic multipliers, and Archimedes' buoyancy principles are explained."
      }
    ]
  }
];

export const obcPhysicsGrade11: Topic[] = [
  {
    title: "11.1 Thermal Physics",
    generalCompetency: "Understand the particulate nature of matter, thermal expansion, and gas laws; analyze the operation of internal combustion engines; evaluate methods of heat transfer; and solve quantitative problems involving heat capacity, latent heat, and calorimetry.",
    subtopics: [
      {
        title: "11.1.1 Simple Kinetic Theory of Matter",
        competencies: [
          "Explain what the kinetic theory is",
          "Describe qualitatively the molecular model of matter",
          "Explain changes of state in terms of the kinetic theory of matter",
          "Apply kinetic theory to explain rates of diffusion, Brownian motion, evaporation and cooling effect of evaporation",
          "Apply the kinetic theory to explain gas pressure"
        ],
        knowledge: "Kinetic theory of matter: matter is composed of tiny, discrete particles in continuous random motion. Molecular models: Solids (closely packed in fixed lattice, vibrating about fixed points, strong cohesive forces); Liquids (close together but random arrangement, moving past each other, moderate forces); Gases (far apart, moving rapidly and randomly in all directions, negligible forces). Cohesive forces (attraction between like molecules) vs. adhesive forces (attraction between unlike molecules). Phase changes: energy absorbed or released changes molecular separation and potential energy without changing temperature. Brownian motion: random jiggly motion of smoke particles suspended in air due to unbalanced collisions with invisible, fast-moving air molecules. Diffusion in fluids. Evaporation: high-energy molecules escape from the surface of a liquid at any temperature, lowering the average kinetic energy of remaining molecules (cooling effect). Gas pressure: collisions of gas molecules with the walls of the container exert a force over the surface area (P = F/A); compressing a gas increases collision frequency and pressure.",
        skills: "Modeling molecular states, demonstrating Brownian motion under a microscope, explaining evaporation cooling qualitatively, analyzing gas pressure variables",
        values: "Appreciation of microscopic molecular actions, teamwork in laboratory experiments, logical deduction",
        learningActivities: [
          "Setting up a smoke cell with a glass cover, illuminating it, and observing the random motion of smoke particles under a microscope to illustrate Brownian motion",
          "Investigating evaporation rates by placing equal volumes of water and ether/acetone on skin or in open dishes and recording temperature changes to study the cooling effect",
          "Modeling gas molecule collisions using digital simulations to observe how pressure shifts with volume reduction and temperature increases"
        ],
        expectedStandard: "The kinetic theory is used to explain states of matter, phase changes, Brownian motion, diffusion, evaporation cooling, and gas pressure mechanics."
      },
      {
        title: "11.1.2 Measurement of Temperature",
        competencies: [
          "Explain what temperature is",
          "Describe physical properties of substances which change with temperature",
          "Measure the temperature with thermometers",
          "Describe suitability of alcohol and mercury for use in liquid-in-glass thermometers",
          "Describe the relationship between the Celsius and Kelvin scales",
          "Describe the structure and use of a thermocouple thermometer",
          "Demonstrate the measurement of temperature using an appropriate thermometer"
        ],
        knowledge: "Temperature defined as the measure of the average kinetic energy of the particles in a substance. Thermometric properties: physical properties that vary continuously and linearly with temperature (e.g., volume of liquid, electrical resistance of a wire, pressure of a gas at constant volume). Thermometers: construction and calibration using fixed points (ice point [0°C] and steam point [100°C]). Liquid-in-glass thermometers: Mercury (high boiling point [357°C], good thermal conductor, responds quickly, but toxic and freezes at -39°C); Alcohol (low freezing point [-115°C], safe, but boils at 78°C and wets glass). Kelvin scale: absolute thermodynamic temperature scale; relation to Celsius: T(K) = t(°C) + 273. Thermocouple thermometer: consists of two wires of different metals joined at two junctions; a temperature difference between junctions creates an EMF measured by a galvanometer. Ideal for high, rapidly changing, or remote temperatures.",
        skills: "Measuring temperature with liquid-in-glass and thermocouple thermometers, calibrating thermometers, converting between Celsius and Kelvin scales",
        values: "Precision, safety in handling mercury, appreciation of electronic temperature sensors in industrial metallurgy",
        learningActivities: [
          "Calibrating an unlabelled liquid-in-glass thermometer by placing it in melting ice and boiling steam to mark the lower and upper fixed points",
          "Converting local daily temperatures and boiling points of liquid gases between Celsius and Kelvin scales",
          "Constructing a simple thermocouple using copper and constantan wires, dipping one junction in ice water and the other in a heated beaker, and recording galvanometer deflections"
        ],
        expectedStandard: "Temperature is measured and compared using liquid-in-glass and thermocouple thermometers, and conversion between Celsius and Kelvin scales is performed accurately."
      },
      {
        title: "11.1.3 Expansion of Solids, Liquids and Gases",
        competencies: [
          "Describe qualitatively the thermal expansion of solids, liquids and gases",
          "Explain the effects of expansion of water on aquatic life",
          "Demonstrate that solids, liquids and gases expand at different rates",
          "Demonstrate how to determine the boiling and melting point of different substances",
          "Explain effects of pressure on the melting and boiling points",
          "Investigate effects of impurities on the melting and boiling points of substances",
          "Demonstrate the effect of varying pressure on volume of a gas",
          "Describe the relationship between temperature and volume of a gas",
          "Explain the Kelvin scale from the relationship between temperature and volume",
          "Demonstrate the use of the ideal gas equation to solve simple numerical problems"
        ],
        knowledge: "Thermal expansion: particles gain kinetic energy, vibrate or move more vigorously, and push further apart, causing volume increases (linear, area, and volume expansion). Order of expansion: gases expand most, followed by liquids, and solids expand least. Anomalous expansion of water: water contracts as it is heated from 0°C to 4°C, reaching maximum density at 4°C. This allows ice to float on lakes, insulating the liquid water underneath and preserving aquatic life in freezing winters. Thermal points: pure substances melt and boil at sharp, distinct temperatures; impurities lower the melting point and raise the boiling point. Pressure effects: increased pressure raises the boiling point (e.g., pressure cooker) and lowers the melting point (e.g., ice-skating regelation). Gas laws: Boyle's Law (P1V1 = P2V2 at constant T); Charles' Law (V1/T1 = V2/T2 at constant P, with T in Kelvin); Ideal Gas Equation: (P1V1)/T1 = (P2V2)/T2. Kelvin temperature is directly proportional to the average kinetic energy of gas particles; absolute zero (0 K or -273°C) is the temperature at which molecular motion ceases.",
        skills: "Comparing expansion rates, determining melting/boiling points of pure and impure samples, graphing temperature-time curves, verifying Boyle's and Charles' laws experimentally, solving ideal gas equation problems",
        values: "Attention to detail, awareness of ecological protection (aquatic thermal insulation), mathematical precision",
        learningActivities: [
          "Demonstrating solid expansion using a ball-and-ring apparatus (ball passes when cold but gets stuck when heated)",
          "Measuring the boiling and melting points of pure water vs. salt-water mixtures to plot heating curves and determine impurity effects",
          "Using a syringe connected to a pressure gauge to record pressure and volume variations (Boyle's law)",
          "Investigating Charles' law by heating a capillary tube containing an air index trapped by a sulfuric acid plug, measuring column length against temperature, and extrapolating to absolute zero"
        ],
        expectedStandard: "The thermal expansion profiles of matter are explained, anomalous expansion of water is justified, and gas laws (Boyle, Charles, and the ideal gas equation) are applied to solve quantitative thermodynamic problems."
      },
      {
        title: "11.1.4 The Engine",
        competencies: [
          "Explain what an internal combustion engine is",
          "Identify the different parts of an internal combustion engine",
          "Describe the operation of the spark plug",
          "Describe the different strokes in a four-stroke internal combustion engine",
          "Describe efficiency of a diesel and petrol engine"
        ],
        knowledge: "Internal combustion engine: a heat engine where the combustion of a fuel occurs with an oxidizer in a confined space (cylinder). Parts: cylinder, piston, intake and exhaust valves, spark plug (petrol) or fuel injector (diesel), crankshaft, and connecting rod. Spark plug operation: produces an electric spark to ignite the compressed petrol-air mixture. Four-stroke cycle: 1. Intake/Induction stroke (piston moves down, intake valve opens, fuel-air mixture drawn in); 2. Compression stroke (both valves closed, piston moves up, compressing the mixture); 3. Power/Expansion stroke (spark ignites mixture, rapid expansion pushes piston down, doing work); 4. Exhaust stroke (exhaust valve opens, piston moves up, forcing burnt gases out). Efficiency: diesel engines are generally more efficient than petrol engines due to higher compression ratios without pre-ignition.",
        skills: "Identifying engine components, illustrating the four-stroke cycle, comparing petrol and diesel engine thermodynamic efficiencies",
        values: "Appreciation of engineering designs, awareness of mechanical efficiency and fuel emissions on air quality",
        learningActivities: [
          "Analyzing a physical cutaway model or digital animation of a four-stroke petrol engine to identify the movements of valves and the piston during each stroke",
          "Tracing the energy conversion pathway in an engine: Chemical energy -> Thermal energy -> Mechanical kinetic energy",
          "Comparing fuel combustion, ignition mechanisms (spark vs. compression), and environmental pollutants in petrol and diesel vehicles"
        ],
        expectedStandard: "The structure and four-stroke cycle of internal combustion engines are described, spark plug operation is explained, and petrol and diesel efficiencies are compared."
      },
      {
        title: "11.1.5 Heat Transfer by Conduction, Convection and Radiation",
        competencies: [
          "Explain methods of heat transfer",
          "Use kinetic theory to explain heat transfer",
          "Demonstrate heat conduction in different substances",
          "Demonstrate the uses of bad and good conductors of heat",
          "Demonstrate convection in liquids and gases",
          "Demonstrate the differences between bad and good absorbers of radiant energy",
          "Demonstrate the differences between good and bad heat emitters",
          "Explain everyday's applications of knowledge on conduction, convection and radiation"
        ],
        knowledge: "Conduction: thermal energy transfer through a medium without overall movement of the matter. Metals are excellent conductors due to free, mobile electrons transferring kinetic energy alongside atomic lattice vibrations. Convection: thermal energy transfer in fluids (liquids and gases) by the actual movement of the heated fluid itself (density currents; warm fluid expands, becomes less dense, and rises, while cold, denser fluid sinks). Radiation: thermal energy transfer via electromagnetic waves (infrared) which requires no medium. Absorption and emission of radiation: black, dull, rough surfaces are excellent absorbers and emitters of radiant heat; white, shiny, smooth surfaces are poor absorbers and emitters (excellent reflectors). Everyday applications: double-walled vacuum (thermos) flask (prevents conduction/convection via vacuum, prevents radiation via silvered walls); domestic hot water systems; sea and land breezes; solar water heaters; greenhouse effect.",
        skills: "Demonstrating conduction rates in metals, setting up convection current loops in water and air, comparing thermal absorption of black and silver surfaces, applying heat transfer principles to explain everyday insulation and heating systems",
        values: "Ecological awareness (greenhouse effect), energy efficiency, cooperation in experimental design",
        learningActivities: [
          "Heating a copper rod and an iron rod of equal dimensions with wax-attached tacks to compare conduction rates",
          "Dropping a crystal of potassium permanganate into a beaker of water, heating the bottom, and observing the purple convection currents rise and fall",
          "Using a convection box with two chimneys and a smoking touch-paper to observe smoke movement guided by a burning candle",
          "Filling a shiny metal can and a dull black can with hot water, recording cooling rates over time to compare heat emission, and repeating with cold water under a lamp to compare absorption"
        ],
        expectedStandard: "The three methods of heat transfer are experimentally demonstrated and explained using kinetic theory, and thermal absorption/emission properties of surfaces and everyday insulation technologies are evaluated."
      },
      {
        title: "11.1.6 Measurements of Heat",
        competencies: [
          "Demonstrate the difference between temperature and heat energy",
          "Describe the terms of heat capacity and specific heat capacity",
          "Identify the SI units of specific heat capacity",
          "Demonstrate how to measure specific heat capacity of solids and liquids",
          "Describe the terms latent heat, specific latent heat of fusion and of vaporisation",
          "Demonstrate the solving of numerical problems on heat measurement"
        ],
        knowledge: "Temperature is a measure of the average kinetic energy of individual particles in a substance. Heat energy is the total thermal energy transferred from a hotter body to a colder body due to a temperature difference (measured in Joules). Heat Capacity (C) as the heat energy required to raise the temperature of a body by 1 Kelvin (C = Q / dT). Specific Heat Capacity (c) as the heat energy required to raise the temperature of 1 kilogram of a substance by 1 Kelvin (c = Q / (m x dT)). SI unit: J/(kg K) or J/(kg °C). Measurement of specific heat capacity: electrical method (using heater, ammeter, voltmeter, and stopwatch) and method of mixtures (calorimetry). Latent Heat (L): energy absorbed or released during a change of state without temperature change. Specific Latent Heat of Fusion (L_f): heat required to change 1 kg of solid to liquid at its melting point. Specific Latent Heat of Vaporisation (L_v): heat required to change 1 kg of liquid to gas at its boiling point. Formulas: Q = mc_dT; Q = mL.",
        skills: "Measuring temperature changes, calculating specific heat capacity using calorimetry, measuring latent heat, solving multi-step heat transfer and energy conservation problems",
        values: "Rigor in thermodynamic measurements, precision, appreciation of high specific heat of water on global climate stabilization",
        learningActivities: [
          "Determining the specific heat capacity of an aluminum block using an electric immersion heater, a voltmeter, an ammeter, and a thermometer in an insulated setup",
          "Mixing hot water of known mass and temperature with cold water in a calorimeter to calculate the heat exchanged and verify energy conservation",
          "Measuring the temperature of melting ice over time to observe the flat plateau region of latent heat absorption and calculating the latent heat of fusion of ice"
        ],
        expectedStandard: "Quantitative calorimeter calculations involving specific heat capacity, latent heat, electrical heat inputs, and thermal mixtures are performed accurately."
      }
    ]
  },
  {
    title: "11.2 Wave Motion",
    generalCompetency: "Understand the mechanics and properties of mechanical waves, differentiate transverse and longitudinal propagation, apply the wave equation, analyze wave behaviors (reflection, refraction, diffraction, and interference), and evaluate the electromagnetic spectrum.",
    subtopics: [
      {
        title: "11.2.1 Simple Ideas of the Wave Motion Theory",
        competencies: [
          "Demonstrate wave motion",
          "Distinguish between longitudinal and transverse waves",
          "Describe the terms associated with waves",
          "Apply the wave equation in solving wave motion problems",
          "Explain the use of waves in everyday life"
        ],
        knowledge: "Waves as physical disturbances that propagate through space, transferring energy and momentum from one point to another without the transfer of matter. Wave classification: Transverse waves (particles of the medium oscillate perpendicular to the direction of wave travel, e.g., water waves, electromagnetic waves, waves in a plucked string); Longitudinal waves (particles of the medium oscillate parallel to the direction of wave travel, e.g., sound waves, compressional waves in a spring). Wave parameters: Amplitude (A, maximum displacement from equilibrium); Period (T, time for one complete oscillation); Frequency (f, number of complete waves per second, f = 1/T); Wavelength (λ, distance between two consecutive in-phase points); Wave front (a line joining all adjacent in-phase points). Wave equation: v = fλ. Graphical representations: displacement-time graphs (frequency/period) and displacement-distance graphs (wavelength/amplitude). Everyday applications: communications, medicine.",
        skills: "Generating waves in slinky springs, illustrating transverse and longitudinal crests/compressions, calculating wave velocity, frequency, and wavelength, interpreting wave graphs",
        values: "Awareness of waves in wireless technologies, systematic mathematical reasoning",
        learningActivities: [
          "Using a slinky spring on a smooth floor to demonstrate transverse waves (vibrating hand side-to-side) and longitudinal waves (pushing and pulling hand forward-backward)",
          "Plotting and interpreting displacement-time and displacement-distance graphs of waves to extract values of amplitude, period, and wavelength",
          "Solving numerical wave problems using the equation v = fλ and converting frequency units (Hz, kHz, MHz)"
        ],
        expectedStandard: "Transverse and longitudinal waves are distinguished, wave parameters are extracted from displacement graphs, and the wave equation v = fλ is applied to solve kinematic wave problems."
      },
      {
        title: "11.2.2 Propagation of Waves",
        competencies: [
          "Explain what propagation, reflection, refraction and diffraction of waves are",
          "Demonstrate constructive and destructive interference of waves"
        ],
        knowledge: "Wave phenomena: 1. Propagation (transmission of wave energy through a medium or vacuum); 2. Reflection (bouncing of waves off a barrier, speed and wavelength remain constant, direction changes); 3. Refraction (bending of waves when passing from one medium to another due to a change in speed, frequency remains constant, wavelength changes); 4. Diffraction (bending/spreading of waves around obstacles or through narrow openings; significant when opening size is comparable to wavelength). Interference: the superposition of two coherent waves. Constructive interference: crest meets crest or trough meets trough, leading to a wave of maximum amplitude (in-phase superposition). Destructive interference: crest meets trough, leading to a wave of minimum or zero amplitude (out-of-phase superposition).",
        skills: "Designing wave tank experiments, drawing wave patterns showing diffraction and refraction, analyzing interference fringes",
        values: "Appreciation of physical wave interactions, team collaboration in ripple tank experiments",
        learningActivities: [
          "Operating a ripple tank to observe water wave reflection from straight and curved barriers, refraction when passing over shallow glass plates, and diffraction through wide and narrow slit barriers",
          "Demonstrating interference of water waves in a ripple tank using two coherent point-source dippers to observe nodal (quiet) and antinodal (loud/active) lines"
        ],
        expectedStandard: "Wave propagation, reflection, refraction, and diffraction are modeled, and the physical mechanisms of constructive and destructive interference are explained."
      },
      {
        title: "11.2.3 Electromagnetic Spectrum",
        competencies: [
          "Describe main components of electromagnetic spectrum",
          "Describe the properties of electromagnetic waves",
          "Identify the sources of each of the rays in the electromagnetic spectrum",
          "Describe the method of detection of each of the main components of the electromagnetic spectrum",
          "Explain the use of each of the waves in the electromagnetic radiation spectrum",
          "Explain the harmful effects of ultra violet radiation, gamma rays and x-rays to life"
        ],
        knowledge: "Electromagnetic (EM) spectrum: a family of transverse waves consisting of oscillating electric and magnetic fields. Components in order of increasing frequency/decreasing wavelength: Radio waves, Microwaves, Infrared, Visible light (red to violet), Ultraviolet (UV), X-rays, Gamma rays. Shared properties: travel through a vacuum, travel at the speed of light in a vacuum (c ≈ 3.0 x 10^8 m/s), transverse, can be reflected, refracted, diffracted, and polarized. Sources and detectors: Radio (transmitters/aerials); Microwaves (magnetrons/receiver dishes); Infrared (hot bodies/photodiodes, thermopiles); Visible (sun, lamps/human eye, photographic film); UV (sun, gas discharge tubes/fluorescent chemicals); X-rays (X-ray tubes/photographic plates); Gamma (radioactive nuclei decay/GM tubes). Uses: communication, cooking, medical imaging, sterilization. Harmful effects of ionizing radiation (UV, X-rays, Gamma): skin cancer, cataracts, mutations, cell death.",
        skills: "Sequencing EM components by physical properties, matching sources and detectors, evaluating safety precautions for high-energy radiation, communicating uses of EM waves",
        values: "Concern for radiation safety, appreciation of medical imaging and global satellite communications",
        learningActivities: [
          "Constructing a comparative chart of the EM spectrum showing wave components, typical wavelengths, frequencies, natural sources, detectors, and everyday applications",
          "Discussing the risks of overexposure to ultraviolet radiation (sunburn, skin cancer) and detailing clinical safety rules in hospital X-ray departments (lead aprons, badge dosimeters)"
        ],
        expectedStandard: "The components and general physical properties of the electromagnetic spectrum are described, and the specific sources, detection methods, applications, and biological hazards of EM radiations are evaluated."
      }
    ]
  },
  {
    title: "11.3 Sound",
    generalCompetency: "Understand the production and propagation of longitudinal sound waves, identify the range of human hearing, determine the speed of sound, evaluate pitch, loudness, quality, and ultrasonic applications, and describe noise pollution mitigation.",
    subtopics: [
      {
        title: "11.3.1 Properties of Sound",
        competencies: [
          "Explain how sound is produced",
          "Describe what rarefactions and compressions are",
          "Describe the approximate range of audible frequencies",
          "Investigate that sounds requires a medium for transmission",
          "Determine the speed of sound in air",
          "Describe the relative speed of sound in solid, liquid and gas",
          "Demonstrate the characteristics of sound waves",
          "Describe the factors which influence the quality of sound",
          "Describe what ultrasonic is",
          "Describe the uses of ultrasonic",
          "State how to minimise sound pollution"
        ],
        knowledge: "Sound as a longitudinal mechanical wave produced by vibrating objects. Propagation involves compressions (regions of high pressure and density where particles are pushed together) and rarefactions (regions of low pressure and density where particles are pulled apart). Human audible range: 20 Hz to 20,000 Hz. Sound requires a material medium for transmission (cannot travel through a vacuum). Speed of sound: determined experimentally in air (echo method, speed ≈ 330 m/s). Speed variations: speed of sound is fastest in solids (strongest bonds, rapid elastic recovery), moderate in liquids, and slowest in gases. Wave characteristics: Loudness relates directly to the amplitude of the wave; Pitch relates directly to the frequency of the wave. Quality (timbre) of a sound note depends on its waveform and the presence of overtones. Ultrasound: sound waves with frequencies above 20,000 Hz. Uses: medical pre-natal scanning, sonar depth sounding, quality control, industrial cleaning. Sound pollution: minimized using soundproof porous structures, planting trees, and noise barriers.",
        skills: "Demonstrating the necessity of a medium for sound, calculating the speed of sound using echo methods, distinguishing pitch and loudness, communicating ultrasound applications, identifying noise-reduction strategies",
        values: "Environmental awareness (noise pollution), appreciation of medical acoustics, active group collaboration",
        learningActivities: [
          "Conducting the bell-jar experiment: pumping air out of a sealed jar containing an active electric bell to observe that sound fades to silence while the hammer still vibrates",
          "Measuring the speed of sound in air by clapping hands in front of a tall wall, measuring the distance to the wall and the time for 20 echoes, and calculating speed = 2d / t",
          "Using an oscilloscope connected to a microphone to observe how changing voice pitch changes wave frequency (number of cycles on screen) and changing volume changes amplitude",
          "Discussing why dolphins and bats use ultrasound, and researching ultrasonic diagnostic scanning in clinics"
        ],
        expectedStandard: "Sound wave production, longitudinal propagation (compressions and rarefactions), and speed across states of matter are analyzed; characteristics (pitch, loudness, quality) are distinguished, and ultrasound and sound-proofing applications are explained."
      }
    ]
  },
  {
    title: "11.4 Light",
    generalCompetency: "Understand geometric optics, describe rectilinear propagation and reflection, construct ray diagrams for plane mirrors, analyze refraction and Snell's law, explain total internal reflection and optical fibers, and solve thin-lens problems.",
    subtopics: [
      {
        title: "11.4.1 Rectilinear Propagation of Light",
        competencies: [
          "Describe the rectilinear propagation of light",
          "Investigate the formation of shadows and eclipse",
          "Describe reflection of light",
          "Investigate the laws of reflection of light",
          "Demonstrate the formation of images by plane mirrors",
          "Identify the position of an image using plane mirrors"
        ],
        knowledge: "Light as an electromagnetic wave that travels in a straight line (rectilinear propagation). Shadows: formed when light is blocked by an opaque object; shadow regions include the umbra (complete darkness) and penumbra (partial shadow). Eclipses: Solar eclipse (Moon sits between Earth and Sun); Lunar eclipse (Earth sits between Moon and Sun). Reflection: bouncing of light off a surface. Regular reflection (on smooth surfaces, e.g., mirrors) vs. diffuse reflection (on rough surfaces, e.g., walls). Laws of Reflection: 1. The angle of incidence (i) equals the angle of reflection (r); 2. The incident ray, reflected ray, and normal at the point of incidence all lie in the same plane. Image in a plane mirror: virtual, upright, same size as the object, laterally inverted, and the object distance from the mirror equals the image distance behind the mirror.",
        skills: "Constructing ray diagrams for shadows and eclipses, verifying laws of reflection using pins and mirrors, drawing scaled ray reflections to locate virtual images",
        values: "Aesthetic appreciation of symmetry, precision in line drawing, scientific inquiry",
        learningActivities: [
          "Demonstrating rectilinear propagation using three aligned cardboard screens with central holes and a light source",
          "Using optical pins, a plane mirror, and paper to track incident and reflected rays, measuring angles of incidence and reflection to verify i = r",
          "Drawing scaled ray diagrams to show how light reflects from an object into the eye, locating the virtual image behind a plane mirror"
        ],
        expectedStandard: "Rectilinear propagation, shadow/eclipse formations, and the laws of reflection are described, and virtual images in plane mirrors are constructed using scaled ray diagrams."
      },
      {
        title: "11.4.2 Refraction of Light",
        competencies: [
          "Describe what refraction of light is",
          "Explain the terms of refraction of light",
          "Verify the laws of refraction of light",
          "Describe what refractive index is",
          "Investigate the refractive index of a glass block",
          "Calculate refractive index of a substance using real and apparent depth",
          "Explain the term 'critical angle'",
          "Describe the relationship between critical angle and refractive index",
          "Explain how total internal reflection occurs",
          "Explain how total internal reflection is used"
        ],
        knowledge: "Refraction as the bending of light rays when they pass from one optical medium to another of different optical density, caused by a change in the speed of light. Terms: incident ray, refracted ray, emergent ray, normal, angle of incidence (i), angle of refraction (r). Laws of Refraction: 1. The incident ray, refracted ray, and normal all lie in the same plane; 2. Snell's Law (sin i / sin r = constant [n] for a given pair of media). Refractive index (n): n = speed of light in vacuum / speed in medium; n = sin i / sin r (from air to medium); n = real depth / apparent depth (due to optical lifting). Critical angle (c): the angle of incidence in the optically denser medium for which the angle of refraction in the less dense medium is 90°. Relationship: n = 1 / sin c. Total Internal Reflection (TIR): occurs when light travels from a denser to a rarer medium and the angle of incidence exceeds the critical angle (i > c), causing all light to be reflected back into the denser medium. Applications: optical fibers (telecommunications, endoscopes), periscopes, prisms in binoculars.",
        skills: "Tracking refracted rays through glass blocks, measuring angles to calculate refractive indices, calculating critical angles, constructing ray diagrams illustrating total internal reflection",
        values: "Analytical accuracy, appreciation of glass design in modern fiber optics and telecommunication systems",
        learningActivities: [
          "Using a rectangular glass block and pins on a drawing board to trace the path of light, measuring angles i and r to plot sin i against sin r and calculate the refractive index",
          "Measuring the real thickness of a glass block and its apparent thickness under a traveling microscope to determine refractive index using the depth ratio",
          "Using a semicircular glass prism and a ray box to locate the critical angle and observe total internal reflection as the angle of incidence is increased"
        ],
        expectedStandard: "The laws of refraction and Snell's equation are verified, and calculations of refractive index, critical angle, and apparent depth are performed accurately; total internal reflection and fiber optic applications are explained."
      },
      {
        title: "11.4.3 Lenses",
        competencies: [
          "Describe different types of lenses",
          "Explain the action of lenses on beams of light",
          "Demonstrate how to determine the focal length",
          "Demonstrate how to obtain images formed by converging lenses",
          "Describe the uses of lenses in everyday life"
        ],
        knowledge: "Lenses: curved transparent media that refract light. Types: Convex / Converging lenses (thicker in the middle, converge parallel rays to a principal focus); Concave / Diverging lenses (thinner in the middle, diverge parallel rays). Optical terms: principal axis, optical centre (C), principal focus (F), focal length (f). Lens formula: 1/f = 1/u + 1/v. Linear magnification: m = image height / object height = v / u. Characteristics of images formed by a convex lens depend on object distance (u): real, inverted, and diminished (u > 2f, e.g., camera); real, inverted, and magnified (f < u < 2f, e.g., projector); virtual, erect, and magnified (u < f, e.g., magnifying glass). Vision defects: Short-sightedness (myopia, light focuses in front of retina, corrected with concave lenses); Long-sightedness (hypermetropia, light focuses behind retina, corrected with convex lenses). Uses: spectacles, LCD projectors, cameras, microscopes, telescopes.",
        skills: "Experimentally determining focal lengths of convex lenses, constructing ray diagrams for converging lenses at various object positions, calculating image distances and magnifications, identifying corrective lenses for vision defects",
        values: "Care and precision in aligning optical setups, appreciation of biological and mechanical eye-camera similarities",
        learningActivities: [
          "Measuring the focal length of a convex lens by focusing a distant window image onto a white screen and measuring the lens-screen distance",
          "Setting up a lens holder, an illuminated object (e.g., crosswires), a convex lens, and a screen on an optical bench to find corresponding u and v values and plot 1/v against 1/u",
          "Drawing scaled ray diagrams using three standard rays (parallel to axis, through optical centre, through focus) to locate and characterize images for u > 2f, u = 2f, f < u < 2f, and u < f"
        ],
        expectedStandard: "The focal length of a convex lens is determined experimentally, ray diagrams are constructed for various object distances, and thin-lens equations are solved for focal length, object/image distance, and magnification."
      }
    ]
  },
  {
    title: "11.5 Magnetism",
    generalCompetency: "Understand magnetic phenomena, explain magnetization and demagnetization, analyze magnetic fields, and relate the magnetic properties of iron and steel to their applications.",
    subtopics: [
      {
        title: "11.5.1 Simple Phenomenon of Magnetism",
        competencies: [
          "Describe properties of magnets",
          "Explain the domain theory of magnetism",
          "Demonstrate induced magnetism",
          "Demonstrate the making of a magnet",
          "Demonstrate the demagnetisation of a magnet",
          "Demonstrate the plotting of magnetic field lines",
          "Distinguish the magnetic properties of iron and steel",
          "Explain the use of magnetic screening and magnetic keepers",
          "Describe the uses of magnets"
        ],
        knowledge: "Fundamental properties of magnets: possess two poles (North and South), like poles repel, unlike poles attract; a freely suspended magnet aligns in the Earth's North-South direction. Domain theory of magnetism: magnetic materials contain tiny atomic magnets (magnetic dipoles) grouped in regions called domains. Unmagnetized: domains point in random directions, canceling each other out. Magnetized: domains are aligned in one direction. Induced magnetism: a magnetic material becomes temporarily magnetized when placed near or in contact with a permanent magnet. Methods of magnetization: stroking (single or double) and electrical method (using a solenoid carrying a high direct current [DC]). Methods of demagnetization: heating to redness, hammering repeatedly in an East-West direction, and electrical method (inserting the magnet into a solenoid carrying an alternating current [AC] and slowly withdrawing it). Magnetic field lines: map the region where magnetic forces act (lines emerge from North and enter South, never cross). Soft magnetic materials (Iron: easily magnetized and demagnetized, high susceptibility, low retentivity) vs. Hard magnetic materials (Steel: difficult to magnetize and demagnetize, low susceptibility, high retentivity). Magnetic screening: using soft iron shields to protect sensitive instruments from external magnetic fields. Magnetic keepers: soft iron bars placed across the poles of stored magnets to maintain domain alignment. Uses: circuit breakers, loudspeakers, electromagnets, electric motors.",
        skills: "Demonstrating magnetic forces, magnetizing iron/steel needles, demagnetizing using AC currents, plotting field patterns with compasses/iron filings, comparing iron and steel magnetic behaviors",
        values: "Care in storing laboratory magnets, logical application of domain theory, active collaboration",
        learningActivities: [
          "Testing attraction and repulsion of suspended bar magnets, and demonstrating induced magnetism using unmagnetized iron nails attracted to a permanent magnet",
          "Magnetizing steel needles using both the stroking method and by inserting them into a coil connected to a DC power supply",
          "Demagnetizing a magnetized steel needle by placing it in an AC coil and slowly pulling it out along an East-West line",
          "Plotting the magnetic field pattern of a single bar magnet and attracting/repelling double bar magnets using iron filings and a small plotting compass",
          "Comparing the load-carrying capacity and retention of magnetism in iron cores vs. steel cores when a solenoid's current is switched on and off"
        ],
        expectedStandard: "The properties of magnets and domain theory are explained, magnetization and demagnetization procedures are performed, magnetic field lines are plotted, and the physical applications of iron and steel magnetic profiles are compared."
      }
    ]
  }
];

export const obcPhysicsGrade12: Topic[] = [
  {
    title: "12.1 Static Electricity",
    generalCompetency: "Understand electrostatics; explain the properties, detection, and charging mechanisms of static charges; and evaluate the environmental hazards and industrial applications of static electricity.",
    subtopics: [
      {
        title: "12.1.1 Static Electricity",
        competencies: [
          "Demonstrate the existence of static charges",
          "Explain how to detect electric charges",
          "Describe the properties and uses of static charges",
          "Describe the electric charging and discharging of objects",
          "Explain the relationship between current and static electricity",
          "Investigate effects of static charges on the environment"
        ],
        knowledge: "Electrostatics: the study of electric charges at rest. Existence of static charges: positive and negative charges produced by the transfer of electrons when dissimilar insulating materials are rubbed together (e.g., polythene rubbed with wool gains electrons and becomes negative; cellulose acetate rubbed with silk loses electrons and becomes positive). Detection: using a gold-leaf electroscope (deflection of the gold leaf indicates presence of charge). Law of Electrostatics: like charges repel, unlike charges attract. Charging methods: friction and electrostatic induction (charging a conductor without contact using a nearby charged body). Discharging: charges can bleed off slowly through moisture in the air or rapidly through spark discharge. Relationship to current: static electricity consists of stationary charges, whereas current electricity is the rate of flow of these charges. Environmental effects: lightning (clouds charge by friction, discharging via massive sparks to earth; protected by lightning conductors). Industrial applications: electrostatic precipitators (pollution control in chimneys), photocopiers, spray painting, and inkjet printers.",
        skills: "Charging insulators by friction, operating a gold-leaf electroscope to identify charge signs, charging metal spheres by induction, explaining lightning protection, evaluating industrial electrostatic precipitators",
        values: "Safety in storm environments, concern for air pollution control, precision in observing delicate electroscope deflections",
        learningActivities: [
          "Rubbing plastic combs, polythene, and acetate rods with cloth and testing their ability to attract small paper bits or deflect a stream of water",
          "Charging a gold-leaf electroscope and using charged rods of known sign to determine whether an unknown charged object is positive or negative (using the principle of repulsion as the only sure test)",
          "Demonstrating electrostatic induction by bringing a negatively charged rod close to a metal sphere on an insulating stand, earthing the sphere momentarily, removing the earth, and then removing the rod to leave a net positive charge on the sphere"
        ],
        expectedStandard: "The existence and properties of positive and negative static charges are demonstrated, charging by friction and induction are executed, and environmental lightning hazards and industrial precipitator/photocopier applications are evaluated."
      }
    ]
  },
  {
    title: "12.2 Current Electricity",
    generalCompetency: "Understand charge, current, electromotive force, and potential difference; analyze the structure and chemistry of primary and secondary cells; evaluate electrical resistance and Ohm's law; calculate electrical heating, power, and cost; and analyze the magnetic effects of electric currents.",
    subtopics: [
      {
        title: "12.2.1 Electric Charge, Current, and Potential Difference",
        competencies: [
          "Describe the terms associated with electricity",
          "Identify the units of electric charge and current",
          "Demonstrate how to measure an electric current",
          "Describe what potential difference is",
          "Describe what the volt is",
          "Differentiate between potential difference (PD) and electromotive force (EMF)",
          "Describe the basic concept of EMF",
          "Demonstrate the measuring of potential difference (PD) and electromotive force (EMF)"
        ],
        knowledge: "Electric current (I) defined as the rate of flow of electric charge (I = Q / t). SI unit of charge: Coulomb (C); of current: Ampere (A = 1 C/s). Potential Difference (PD) as the electrical work done per unit charge in driving charges between two points in a circuit (V = W / Q). The Volt (V) defined as one Joule per Coulomb. Electromotive Force (EMF) as the total energy supplied by a source (cell/generator) per unit charge in driving charge round a complete circuit. Difference: EMF refers to energy conversion into electrical form; PD refers to electrical energy converted to other forms (heat, light) across circuit components. Measurement: Ammeter connected in series (low internal resistance); Voltmeter connected in parallel (high internal resistance). Measuring EMF: voltmeter connected directly across open-terminal battery source; Measuring PD: voltmeter connected across a loaded component in a closed circuit.",
        skills: "Constructing circuits, using ammeters and voltmeters to measure current and potential differences, calculating charge and energy, distinguishing open-circuit EMF and closed-circuit terminal PD",
        values: "Precision in circuit wiring, safety in electrical measurements, logical deduction",
        learningActivities: [
          "Connecting a battery, a switch, an ammeter, and a lamp in series to measure current under various configurations",
          "Measuring the potential difference across a bulb, and comparing open-terminal cell voltage (EMF) to closed-circuit lamp terminal voltage (PD) to observe internal voltage drop"
        ],
        expectedStandard: "Electric current, charge, PD, and EMF are defined and measured correctly, and ammeters and voltmeters are successfully integrated into electrical circuits."
      },
      {
        title: "12.2.2 Electric Cells",
        competencies: [
          "Describe the structure of primary and secondary cells",
          "Demonstrate charging and discharging of the accumulator",
          "Identify methods of disposal of used cells"
        ],
        knowledge: "Electric cells: devices that convert chemical energy into electrical energy. Primary cells (cannot be recharged as chemical reactions are irreversible, e.g., zinc-carbon dry cells, alkaline cells). Secondary cells (can be recharged by passing an electric current through them in the reverse direction to reverse chemical reactions, e.g., lead-acid accumulators, lithium-ion cells). Lead-acid accumulator structure: lead dioxide positive plate, spongy lead negative plate, dilute sulfuric acid electrolyte. Charging: connecting the positive terminal of a DC charger to the positive accumulator terminal (electrical energy converted to chemical energy). Discharging: current flows from cell to power loads. Environmental hazards: battery disposal releases toxic heavy metals (lead, cadmium, mercury) into soil and water tables. Correct recycling and waste management practices are required.",
        skills: "Differentiating cell structures, executing charging/discharging protocols, evaluating environmental safety protocols for heavy metal battery disposal",
        values: "Environmental stewardship, sustainable resource management, awareness of heavy metal toxicity",
        learningActivities: [
          "Disassembling or studying models of a standard dry zinc-carbon cell to identify anode, cathode, and ammonium chloride paste electrolyte",
          "Measuring terminal voltage changes of a lead-acid accumulator during charging (using a DC power pack) and discharging (across a heavy load resistor)",
          "Researching local recycling initiatives and outlining correct safety guidelines for the disposal of automotive and domestic cell batteries"
        ],
        expectedStandard: "The chemical and physical structural differences between primary and secondary cells are described, accumulator charging mechanics are demonstrated, and the environmental impacts of battery disposal are evaluated."
      },
      {
        title: "12.2.3 Electrical Resistance",
        competencies: [
          "Explain the meaning of resistance",
          "Demonstrate how to determine resistance in a simple circuit",
          "Describe the relationship between current and potential difference in Ohmic and non-Ohmic conductors",
          "Describe what the internal resistance of a cell is",
          "Calculate the resistance in series and parallel circuits with Ohm's law"
        ],
        knowledge: "Resistance (R) as the opposition of a conductor to the flow of charge, defined as the ratio of potential difference to current (R = V / I). Ohm's Law: the current through a metallic conductor is directly proportional to the potential difference across it, provided physical conditions (like temperature) remain constant. Ohmic conductors: maintain constant resistance (straight-line V-I graph passing through origin, e.g., copper wires, fixed resistors). Non-Ohmic conductors: resistance varies with current/voltage (curved V-I graph, e.g., filament lamps, diodes, thermistors). Internal resistance (r): resistance within the cell itself due to chemical opposition, causing terminal voltage (V) to be less than EMF (E): V = E - Ir. Resistors in series: R_total = R1 + R2 + R3. Resistors in parallel: 1/R_total = 1/R1 + 1/R2 + 1/R3.",
        skills: "Determining resistance from V-I slopes, plotting Ohmic and non-Ohmic characteristic curves, calculating equivalent resistances of series-parallel networks, calculating internal resistance voltage losses",
        values: "Mathematical accuracy, scientific analysis of circuit properties, group collaboration",
        learningActivities: [
          "Constructing an Ohm's law test circuit using a rheostat, ammeter, voltmeter, and a fixed resistor to plot a V-I graph and determine the resistance from the gradient",
          "Repeating the experiment using a filament lamp and a semiconductor diode to plot characteristic non-Ohmic curves and explain how resistance changes",
          "Solving complex resistance network problems containing combinations of series and parallel branches using Ohm's law"
        ],
        expectedStandard: "Ohm's law is verified and applied to calculate resistance, series-parallel resistor networks are resolved mathematically, and the physical characteristics of Ohmic, non-Ohmic, and internal cell resistance are analyzed."
      },
      {
        title: "12.2.4 Heating Effect of an Electric Current",
        competencies: [
          "Demonstrate energy transformations in an electric circuit",
          "Investigate the heating effect of an electric current",
          "Demonstrate how to calculate electrical energy",
          "Describe the relationship of voltage, current and power",
          "Demonstrate how to calculate the cost of using electrical energy",
          "Describe the use of switches, fuses, earthing and the three-pin-plugs",
          "Explain the need for earthing metal cases and for double insulation",
          "Describe the meaning of three wires found in the cable",
          "Describe the domestic electrical wiring system",
          "Describe ways of conserving electrical energy in homes and industry"
        ],
        knowledge: "Heating effect: electrical energy is converted to thermal energy when current passes through high-resistance wires (collisions between moving electrons and metal ions). Electrical energy formulas: E = VIt = I^2Rt = (V^2 / R)t. Electrical power: P = VI = I^2R = V^2 / R. Commercial unit of electrical energy: kilowatt-hour (kWh), defined as energy consumed by a 1 kW appliance running for 1 hour. Cost calculation: Cost = Energy (in kWh) x Unit Price. Domestic electrical safety: 1. Switches (placed on Live wire to disconnect voltage); 2. Fuses (thin wire that melts on excess current, protecting appliances; placed on Live wire); 3. Three-pin plugs: Live (Brown, carries high voltage), Neutral (Blue, completes circuit), Earth (Green/Yellow, safety wire connected to metal casing). Metal casings must be earthed to prevent shock if a live wire touches the case. Double insulation: plastic casing prevents user contact with live wires, eliminating the need for an earth wire. Domestic wiring: ring main, lighting, and cooker circuits. Conservation: using energy-saving LED bulbs, turning off standby appliances, and using solar alternatives.",
        skills: "Calculating electrical energy and power, computing commercial electrical bills using kWh, describing three-pin plug wiring, justifying safety devices (fuses, earth wires, double insulation), planning electrical conservation",
        values: "Safety first, energy conservation awareness, financial and resource responsibility",
        learningActivities: [
          "Using a water calorimeter with an electric heater coil to measure temperature changes and calculate the converted electrical energy (E = VIt)",
          "Reading electricity meters, examining standard utility bills, and calculating the cost of operating household appliances (kettles, TVs, fridges) over specific durations",
          "Wiring a domestic three-pin plug correctly, ensuring correct wire color coding (Live: Brown, Neutral: Blue, Earth: Green-Yellow) and fuse rating selection",
          "Analyzing a schematic of a domestic consumer unit showing ring main circuits, RCDs, and lighting loops"
        ],
        expectedStandard: "Electrical energy, power, and utility costs are calculated accurately; domestic safety features (switches, fuses, three-pin plugs, earthing, double insulation) and home wiring systems are explained."
      },
      {
        title: "12.2.5 Magnetic Effects of Electric Currents",
        competencies: [
          "Explain magnetic field patterns of electric currents",
          "Describe the applications of the magnetic effect of an electric current",
          "Explain the behaviour of an electric current in a magnetic field",
          "Describe the application of a current placed in a magnetic field",
          "Describe the nature of forces between parallel currents",
          "Describe the effect of magnetic fields on human health and environment"
        ],
        knowledge: "Oersted's discovery: an electric current produces a magnetic field around it. Magnetic field lines: 1. Straight current-carrying wire (concentric circles, direction found using the Right-Hand Grip Rule); 2. Flat circular coil; 3. Solenoid (field resembles a bar magnet, direction of poles found using right-hand rule or S-N loop rule). Applications: electromagnets, electric bells, relays (using low current to switch on a high current circuit), magnetic circuit breakers. The Motor Effect: a current-carrying conductor placed in a magnetic field experiences a force due to the interaction of the fields. Direction of force: Fleming's Left-Hand Rule (Thumb: Force, Index: Magnetic Field, Middle: Current). Applications: Direct Current (DC) motor (coil rotates in magnetic field, split-ring commutator reverses current every half turn to maintain rotation), moving-coil galvanometer, and ammeters. Forces between parallel currents: parallel currents flowing in the same direction attract; in opposite directions repel. Environmental health: exposure to strong electromagnetic fields may interfere with communication systems and pacemaker operations.",
        skills: "Plotting magnetic field patterns around wires and solenoids, constructing electromagnets, applying Fleming's left-hand rule, illustrating the DC motor, explaining parallel current forces",
        values: "Safety near high-voltage lines, appreciation of electromagnetism in heavy industry, team cooperation",
        learningActivities: [
          "Sprinkling iron filings on a cardboard sheet through which a heavy current-carrying wire passes to observe concentric magnetic field lines",
          "Constructing an electric bell or a simple electromagnetic relay on a wooden board and testing its switching operation",
          "Building a simple DC electric motor using a coil of wire, a bar magnet, paperclips, and a cell, and explaining how the commutator functions",
          "Analyzing forces between parallel wires connected to a high-current source to observe attraction and repulsion"
        ],
        expectedStandard: "The magnetic fields of current-carrying conductors are plotted, electromagnet and relay applications are explained, Fleming's left-hand rule is applied to motor dynamics, and forces between parallel currents are evaluated."
      }
    ]
  },
  {
    title: "12.3 Electromagnetic Induction",
    generalCompetency: "Understand the principles of electromagnetic induction; apply Faraday's and Lenz's laws; compare structural designs of AC and DC generators; analyze iron-core transformers; and evaluate high-voltage power transmission systems.",
    subtopics: [
      {
        title: "12.3.1 The Phenomenon of Electromagnetic Induction",
        competencies: [
          "Investigate the phenomenon of electromagnetic induction",
          "Describe the factors affecting magnitude and direction of induced EMF",
          "State the direction of current produced by an induced EMF"
        ],
        knowledge: "Electromagnetic Induction: the production of an Electromotive Force (EMF) or current in a conductor when it cuts through magnetic flux or is subjected to a changing magnetic field. Faraday's Law: the magnitude of the induced EMF is directly proportional to the rate of change of magnetic flux linkage. Factors affecting magnitude: speed of relative motion between magnet and coil, strength of the magnet, number of turns of the coil. Lenz's Law: the direction of the induced current is always such that it opposes the change producing it (consequence of conservation of energy; mechanical work done pushing the magnet against repulsion converts into electrical energy). Direction determination: Fleming's Right-Hand Rule (for generators/induced current; Thumb: motion, Index: field, Middle: induced current).",
        skills: "Conducting electromagnetic induction experiments, applying Faraday's and Lenz's laws to predict current directions, applying Fleming's right-hand rule to generators",
        values: "Logical reasoning, appreciation of energy conservation, scientific precision",
        learningActivities: [
          "Pushing a bar magnet into and out of a solenoid connected to a sensitive center-zero galvanometer, recording needle deflections to verify Faraday's and Lenz's laws",
          "Using physical coils and moving magnets to predict the poles induced at the coil faces (N-pole induced to repel an incoming N-pole; S-pole induced to attract a retreating N-pole)"
        ],
        expectedStandard: "The phenomenon of electromagnetic induction is demonstrated, and Faraday's and Lenz's laws are applied to determine the magnitude and direction of induced EMF."
      },
      {
        title: "12.3.2 The Simple A.C. and D.C. Generators",
        competencies: [
          "Describe simple A.C. and D.C. generators",
          "Compare the simple A.A. generator with a simple D.C. generator in terms of structure and its nature",
          "Describe the action of a diode in rectification",
          "Explain conversion of an A.C. generator to a D.C. generator",
          "Contrast the current produced by the D.C. generator with that produced from batteries"
        ],
        knowledge: "Generators: devices converting mechanical energy into electrical energy using electromagnetic induction. Alternating Current (AC) generator (alternator): rotating coil in a magnetic field connected to slip-rings; output current oscillates in direction. Direct Current (DC) generator (dynamo): rotating coil connected to a split-ring commutator (reverses coil connections to external circuit every half turn to keep current flowing in one direction). Conversion: replacing slip-rings with a commutator converts AC generator to DC. Diode action: a semiconductor device that acts as a one-way valve, allowing current to flow only in the forward direction, converting AC to pulsating DC (rectification). Comparison: battery DC is steady and constant in magnitude; DC generator output fluctuates in magnitude (ripple) although unidirectional.",
        skills: "Differentiating generator structures, illustrating slip-ring and commutator functions, explaining diode rectification, plotting generator output curves",
        values: "Appreciation of mass electrical production, analytical contrast, safety",
        learningActivities: [
          "Comparing the structural drawings of AC and DC generators to trace slip-rings vs. split-ring commutators",
          "Using an oscilloscope to compare the waveforms of a battery (flat horizontal line), an AC generator (sine wave), and a DC generator (pulsating humps)",
          "Connecting a diode in series with an AC supply and a resistor, and observing the half-wave rectified voltage on an oscilloscope screen"
        ],
        expectedStandard: "The structure and operation of AC and DC generators are compared, conversion between systems is explained, and the pulsating DC of generators is contrasted with steady battery current."
      },
      {
        title: "12.3.3 Transformers",
        competencies: [
          "Demonstrate the principles of mutual induction",
          "Describe the structure and operation of iron core transformers",
          "Apply the transformer and power equations to solve numerical problems involving ideal transformers",
          "Calculate the efficiency of a transformer given data",
          "Explain advantages of high alternating potential difference power transmission",
          "Describe the implications of underground power transmission compared to overhead lines",
          "Describe the effects of improper management of transformers"
        ],
        knowledge: "Mutual induction: a changing current in a primary coil creates a changing magnetic field inside a shared iron core, which induces an EMF in a secondary coil. Structure: primary coil, laminated soft iron core (minimizes eddy current heat loss), secondary coil. Step-up transformer (N_s > N_p, increases voltage, decreases current); Step-down transformer (N_s < N_p, decreases voltage, increases current). Ideal transformer equations: V_p / V_s = N_p / N_s; V_p x I_p = V_s x I_s. Real transformer efficiency: (useful power output / total power input) x 100% = (V_s x I_s) / (V_p x I_p) x 100%. Grid transmission: raising voltage using step-up transformers reduces transmission current, dramatically lowering heat loss in cables (P_loss = I^2R). Underground vs. overhead: overhead lines are cheap and easy to repair but vulnerable to weather; underground cables are safer and weather-proof but expensive and difficult to insulate/cool. Improper transformer management: leads to overheating, insulation breakdown, and grid failures.",
        skills: "Demonstrating mutual induction, constructing simple step-up/down transformers, calculating turns ratios, currents, and voltages, computing transformer efficiencies, analyzing electricity grid power losses",
        values: "Awareness of national power management, financial and environmental efficiency, safety around high-voltage equipment",
        learningActivities: [
          "Winding primary and secondary coils on a U-shaped soft iron core, connecting primary to AC supply and measuring input/output voltages to demonstrate stepping up and down",
          "Solving numerical problems of transformer ratios, input currents, power balances, and thermal efficiencies",
          "Investigating the power loss along simulated long-distance transmission lines with and without step-up and step-down transformers to model the national grid"
        ],
        expectedStandard: "The structures of step-up/down transformers are described, turns and power equations are resolved quantitatively, and the physical and cost benefits of high-voltage grid transmission are evaluated."
      }
    ]
  },
  {
    title: "12.4 Basic Electronics",
    generalCompetency: "Understand thermionic emission, cathode-ray tube operations, and CRO measurements; analyze semiconductor circuit components (resistors, potentiometers, thermistors, LDRs, and capacitors); and evaluate bipolar transistors, logic gates, and multivibrator circuits.",
    subtopics: [
      {
        title: "12.4.1 Thermionic Emission and Electrons",
        competencies: [
          "Describe What thermionic emission is",
          "Investigate properties of cathode rays",
          "Distinguish between direction of flow of electrons and flow of conventional current",
          "Describe applications of electron beams",
          "Describe the basic structure and an action of cathode-ray oscilloscope",
          "Describe the uses of cathode-ray oscilloscope"
        ],
        knowledge: "Thermionic emission: the release of electrons from the surface of a heated metal cathode in a vacuum. Cathode rays: streams of fast-moving electrons emitted from a cathode. Properties: travel in straight lines, carry negative charge, possess mass and kinetic energy, deflected by electric and magnetic fields, and produce fluorescence when colliding with phosphor screens. Conventional current is the flow of positive charge (from positive to negative); electron flow is the actual movement of electrons (from negative to positive). Applications of electron beams: X-ray machines, TV screens, Cathode-Ray Oscilloscopes (CRO). CRO structure: electron gun (heater, cathode, control grid, focusing and accelerating anodes); deflecting plates (Y-plates for vertical deflection [input voltage], X-plates for horizontal deflection [time-base sweep]); fluorescent screen. CRO uses: measuring peak voltage (amplitude), time intervals, and frequency (from wave cycles).",
        skills: "Comparing current directions, illustrating CRT structures, operating CRO controls, calculating AC voltage and frequency from oscilloscope screen traces",
        values: "Appreciation of diagnostic instruments, logical analysis of electron behaviors in vacuum fields",
        learningActivities: [
          "Tracing electron movement and conventional current loop directions on circuit diagrams to clarify historical vs. physical charges",
          "Analyzing a schematic of a cathode-ray tube (CRT) to explain how the electron gun generates, accelerates, and deflects an electron beam",
          "Using a CRO to measure the peak voltage and frequency of an AC signal by reading screen grid squares (graticule) against Volts/Div and Time/Div control settings"
        ],
        expectedStandard: "Thermionic emission and cathode ray properties are described, the internal structure of the CRO is explained, and the CRO is used to measure peak voltages and frequencies from screen displays."
      },
      {
        title: "12.4.2 Circuit Components",
        competencies: [
          "Identify symbols of basic circuit component",
          "Determine resistor values using standard colour codes",
          "Describe action of variable potential divider",
          "Explain the action and application of thermistor and light dependent resistors",
          "Investigate the charging and discharging of capacitors",
          "Describe the role of capacitors in electronic equipments"
        ],
        knowledge: "Circuit component symbols: fixed resistor, potentiometer, thermistor, light-dependent resistor (LDR), capacitor (polarized/non-polarized), diode, LED, relay, transistor. Resistor colour coding: 4-band system (1st band: first digit; 2nd band: second digit; 3rd band: multiplier; 4th band: tolerance, e.g., gold [±5%], silver [±10%]). Potential divider (potentiometer): splits input voltage across two resistors in series, allowing output voltage tuning (V_out = V_in x (R2 / (R1 + R2))). Thermistor: thermal semiconductor sensor (resistance drops as temperature rises - Negative Temperature Coefficient [NTC]). LDR: light-sensitive sensor (resistance drops as light intensity increases). Capacitor: device that stores electric charge on parallel plates. Charging: current flows onto plates until voltage equals supply; Discharging: plates release charge through closed circuits. Roles: filter circuits, time-delay loops, and smoothing pulsating rectified current to steady DC.",
        skills: "Identifying electronic symbols, decoding resistor color bands to calculate resistances, measuring potentiometer voltage drops, demonstrating LDR/thermistor circuit switches, demonstrating capacitor charging/discharging curves, communicating capacitor roles in filters",
        values: "Appreciation of microelectronic automation, accuracy, team cooperation",
        learningActivities: [
          "Decoding color bands on a set of actual resistors and verifying their values using a digital multimeter",
          "Setting up a potential divider with a slide potentiometer to measure how moving the wiper adjusts the output voltage",
          "Constructing light-detector and temperature-detector switching circuits using LDRs and thermistors in series with a voltmeter",
          "Connecting a capacitor, a resistor, a center-zero galvanometer, and a double-throw switch to plot charging and discharging current curves over time"
        ],
        expectedStandard: "Electronic circuit symbols are identified, resistor color codes are decoded, potential divider equations are solved, the sensivity of thermistors and LDRs is analyzed, and capacitor charging behaviors and filtering roles are explained."
      },
      {
        title: "12.4.3 Simple Electronic Systems",
        competencies: [
          "Describe the action of a bipolar transistor",
          "State the different types of logic gates",
          "Demonstrate how to derive the truth tables of logic gates",
          "Describe the use of bistable and astable circuits"
        ],
        knowledge: "Bipolar Junction Transistor (NPN/PNP): three-terminal semiconductor device (Base, Collector, Emitter). Action: small base current (I_b) controls a much larger collector current (I_c), enabling current amplification; when saturated, it acts as an electronic switch (low voltage at base turns collector switch 'off'; high voltage turns it 'on'). Logic gates: basic building blocks of digital electronic processors. Types: NOT (inverter), AND, OR, NAND (NOT-AND), NOR (NOT-OR). Binary states: 0 (low voltage) and 1 (high voltage). Truth tables: summarize output states for all input combinations. Bistable circuits: cross-coupled logic gates (flip-flops) with two stable states, used for 1-bit data storage in computer memory. Astable circuits: multivibrator pulse generator with no stable states, continuously oscillating to generate square clock pulses that control computer processing speeds.",
        skills: "Wiring transistors as electronic switches, deriving truth tables for single and combined logic gates, demonstrating logic gates using discrete switches/LEDs, comparing bistable memory storage and astable pulse clocks",
        values: "Logical reasoning, appreciation of binary computing foundations, active class participation",
        learningActivities: [
          "Constructing an NPN transistor light-activated automatic switch circuit using an LDR and a variable resistor connected to a relay and light bulb",
          "Deriving truth tables for composite logic systems (e.g., combining two NAND gates or AND-OR pathways) and validating with digital logic trainer boards",
          "Using cross-coupled NOR gates to construct a basic bistable flip-flop circuit and observing how a pulse changes and holds the output state"
        ],
        expectedStandard: "The current-amplifying and switching mechanisms of bipolar transistors are explained, truth tables for logic gates are derived, and the operations of bistable memory and astable clock circuits are contrasted."
      }
    ]
  },
  {
    title: "12.5 Atomic Physics",
    generalCompetency: "Understand nuclear atomic structures and isotopes; analyze natural radioactivity (alpha, beta, gamma properties and detection methods); compute radioactive decay half-lives; evaluate nuclear fission and fusion; and describe safety precautions and management practices regarding radioactive waste.",
    subtopics: [
      {
        title: "12.5.1 Nuclear Atom",
        competencies: [
          "Describe the structure of the atom",
          "Describe the composition of the nucleus in terms of protons and neutrons",
          "Explain mass number and atomic number"
        ],
        knowledge: "Nuclear atomic model: a tiny, dense, positively charged central nucleus surrounded by orbiting negative electrons. Nucleus composition: contains nucleons (protons and neutrons). Atomic (proton) number Z: number of protons in the nucleus (determines element identity). Mass (nucleon) number A: total number of protons and neutrons in the nucleus (Composition: Neutrons N = A - Z). Nuclide notation representation: A_Z_X. Isotopes: atoms of the same element containing the same number of protons (Z) but different numbers of neutrons (different mass number A), resulting in identical chemical behavior but different physical masses and nuclear stability.",
        skills: "Drawing nuclear atom configurations, extracting proton and neutron counts from nuclide symbols, representing isotopic structures",
        values: "Scientific rigor, logical analysis of atomic structures, structured representation",
        learningActivities: [
          "Drawing atomic Bohr representations of carbon-12, carbon-14, hydrogen-1, and hydrogen-2 (deuterium) to compare subatomic counts",
          "Translating nuclide symbols (e.g., U-235, U-238, Ra-226) into precise nucleon numbers, proton numbers, and neutron numbers"
        ],
        expectedStandard: "The nuclear structure of the atom is described, nuclide notation is translated, and isotopes are explained in terms of subatomic particle balances."
      },
      {
        title: "12.5.2 Radioactivity",
        competencies: [
          "Describe the nature of radioactivity",
          "Describe the characteristics of the three kinds of radioactive radiations: alpha, beta and gamma",
          "Describe methods of detecting radioactive emissions",
          "Explain the origin and effects of background radiations",
          "Describe what radioactive decay is",
          "Describe what nuclear fusion and fission is",
          "Demonstrate how to determine half-life of a radioactive material",
          "Explain uses of radioactive substances",
          "Describe the safety precautions necessary when handling or storing radioactive substances",
          "Explain the effects of radioactive substances on the environment and health",
          "Investigate management practices which safeguard the environment from radioactive contamination"
        ],
        knowledge: "Radioactivity as the spontaneous and random disintegration of unstable atomic nuclei, emitting radiation to become more stable (unaffected by temperature, pressure, or chemical changes). Radiations: 1. Alpha particle (He-4 nucleus, +2 charge, high ionizing power, low penetration, stopped by paper); 2. Beta particle (fast electron, -1 charge, moderate ionizing/penetration power, stopped by 5 mm aluminum); 3. Gamma ray (high-frequency EM wave, 0 charge, very low ionizing power, extreme penetration, stopped by thick lead). Detectors: Geiger-Müller (GM) tube connected to a ratemeter, photographic plates, cloud chambers, and scintillation counters. Background radiation: constant natural and artificial radiation surrounding us (cosmic rays, radon gas, radioactive elements in rocks/soil, fallout). Radioactive decay: alpha decay decreases A by 4 and Z by 2; beta decay keeps A constant and increases Z by 1. Nuclear energy: Fission (splitting a heavy nucleus into lighter nuclei, releasing massive energy, e.g., nuclear power plants); Fusion (joining light nuclei to form a heavier nucleus under extreme temperatures, e.g., the Sun). Half-life (t_1/2): time taken for the activity of a radioactive sample to reduce to half of its initial value. Uses: medical radiotherapy, diagnostic tracers, carbon dating, industrial thickness control. Hazards: radiation sickness, genetic mutations, cancer. Safety: lead shielding, distance, protective suits. Regulations: ZEMA guidelines, environmental impact assessments, secure deep-geological waste storage.",
        skills: "Comparing alpha, beta, and gamma properties; writing nuclear decay equations; calculating half-lives from decay curves and remaining fractions; justifying safety shielding; analyzing radioactive contamination management",
        values: "Radiation safety consciousness, environmental responsibility, appreciation of nuclear technology benefits alongside risk awareness",
        learningActivities: [
          "Constructing a summary table comparing alpha, beta, and gamma radiations in terms of mass, charge, speed, ionization, penetration, and electric/magnetic field deflections",
          "Writing balanced nuclear equations for alpha decay (e.g., Uranium-238 to Thorium-234) and beta decay (e.g., Carbon-14 to Nitrogen-14)",
          "Plotting a radioactive decay curve (activity against time) to read and determine the half-life of a sample, and solving mathematical fraction problems (e.g., remaining mass after n half-lives)",
          "Investigating the roles of the Zambia Environmental Management Agency (ZEMA) in monitoring radioactive elements, radiation pollution, and licensing industrial source storages"
        ],
        expectedStandard: "Radioactive emissions (alpha, beta, gamma) are characterized, decay equations are formulated, half-lives are resolved using decay curves, fission and fusion are compared, and radiation safety protocols and environmental waste management practices are evaluated."
      }
    ]
  }
];
