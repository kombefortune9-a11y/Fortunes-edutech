import { Topic } from './syllabi';

export const obcAdditionalMathGrade10: Topic[] = [
  {
    title: "10.1 Coordinate Geometry",
    generalCompetency: "Understand and apply coordinate geometry principles to straight lines, mid-points, gradients, parallel and perpendicular equations, and areas of rectilinear shapes.",
    subtopics: [
      {
        title: "10.1.1 Distance, Mid-point, and Equation of a Straight Line",
        competencies: [
          "Calculate the length of a line segment given two coordinates",
          "Find the mid-point coordinates between two points",
          "Find the gradient and formulate the equation of a straight line in various forms",
          "Plot and interpret lines in the form y = mx + c"
        ],
        knowledge: "Length of a line segment d = √[(x2 - x1)² + (y2 - y1)²]. Mid-point coordinates M = ((x1 + x2)/2, (y1 + y2)/2). Gradient m = (y2 - y1)/(x2 - x1). Straight line forms: gradient-intercept form (y = mx + c), point-gradient form (y - y1 = m(x - x1)), and double intercept form (x/a + y/b = 1).",
        skills: "Computation of distance and mid-point, interpolation of straight-line parameters, plotting linear relationships",
        values: "Precision in spatial plotting, appreciation of linear models in structural coordinates",
        learningActivities: [
          "Calculating the distance and mid-point for given pairs of coordinate points in four quadrants",
          "Determining straight-line equations given a point and a gradient, or two coordinate points"
        ],
        expectedStandard: "Lengths, mid-points, and complete straight-line equations are correctly calculated and graphed."
      },
      {
        title: "10.1.2 Parallel and Perpendicular Lines",
        competencies: [
          "Solve problems involving gradients of parallel and perpendicular lines",
          "Find coordinates of intersection points of straight lines",
          "Identify and verify collinear points"
        ],
        knowledge: "Parallel lines have equal gradients (m1 = m2). Perpendicular lines have gradients whose product is -1 (m1 × m2 = -1). Points are collinear if they lie on the same straight line, sharing identical gradients between any segment.",
        skills: "Applying gradient relationships, solving simultaneous linear coordinate equations, testing for collinearity",
        values: "Analytical rigor, geometrical reasoning, logical deduction",
        learningActivities: [
          "Finding the equation of a line passing through a given point that is perpendicular or parallel to another line",
          "Solving for the intersection coordinates of two intersecting linear equations"
        ],
        expectedStandard: "Perpendicular/parallel line relationships and point intersections are solved and verified."
      },
      {
        title: "10.1.3 Area of Rectilinear Figures",
        competencies: [
          "Solve coordinate geometry problems involving the area of polygons and rectilinear figures"
        ],
        knowledge: "Area of a polygon with coordinates (x1,y1), (x2,y2), ... (xn,yn) calculated using the matrix shopper/coordinate formula: Area = 0.5 × |(x1y2 + x2y3 + ... + xny1) - (y1x2 + y2x3 + ... + ynx1)|.",
        skills: "Computation of areas using coordinate coordinates, mapping geometric boundaries",
        values: "Accuracy in calculation, spatial visualization",
        learningActivities: [
          "Calculating the area of triangles and quadrilaterals given their vertices on a Cartesian plane",
          "Applying coordinate area formulas to resolve physical land parcel measurement scenarios"
        ],
        expectedStandard: "The area of any rectilinear figure defined by coordinates is cleanly computed."
      }
    ]
  },
  {
    title: "10.2 Systems of Equations",
    generalCompetency: "Solve simultaneous systems of equations involving linear-quadratic combinations and systems with three variables.",
    subtopics: [
      {
        title: "10.2.1 Linear and Quadratic Simultaneous Equations",
        competencies: [
          "Solve systems of simultaneous equations containing one linear and one quadratic equation"
        ],
        knowledge: "Simultaneous systems consisting of a linear (ax + by = c) and a quadratic equation (dx² + ey² + fxy = g) solved primarily through the substitution method, yielding up to two pairs of solutions (intersection coordinates).",
        skills: "Algebraic substitution, factoring quadratic outputs, interpreting intersections",
        values: "Decisiveness in algebraic paths, precision in solving systems",
        learningActivities: [
          "Isolating a variable from the linear equation and substituting it into the quadratic equation to solve for both variables",
          "Verifying the algebraic solutions graphically by plotting the line and the curve to observe intersections"
        ],
        expectedStandard: "Linear-quadratic simultaneous systems are solved correctly with both pairs of coordinates."
      },
      {
        title: "10.2.2 Simultaneous Equations with Three Variables",
        competencies: [
          "Solve systems of linear equations containing three variables"
        ],
        knowledge: "Systems of three linear equations (with variables x, y, and z) solved systematically using elimination, substitution, or matrix methods (Cramer's rule or row operations).",
        skills: "Multivariable elimination, systematic reduction, matrix computation",
        values: "Methodical execution, algebraic discipline, logical persistence",
        learningActivities: [
          "Reducing a 3-variable system into a 2-variable system using elimination and solving for the unknown variables",
          "Using determinants or Cramer's rule to find the unique solution of a three-equation network"
        ],
        expectedStandard: "Systems of three linear equations are successfully solved and verified."
      }
    ]
  },
  {
    title: "10.3 Functions",
    generalCompetency: "Understand function notation, inverse and composite functions, modulus functions, quadratic properties, inequalities, and discriminant applications.",
    subtopics: [
      {
        title: "10.3.1 Concept, Notation, and Modulus of Functions",
        competencies: [
          "Describe a function, its domain, co-domain, and range",
          "Evaluate the modulus (absolute value) of a function",
          "Differentiate one-to-one and many-to-one relationships"
        ],
        knowledge: "A function maps elements from a domain to a co-domain. The range is the set of actual images. Modulus |f(x)| represents the absolute/non-negative magnitude of the output, reflecting negative y-values across the x-axis.",
        skills: "Domain and range evaluation, function mapping representation, modulus calculations",
        values: "Typographical awareness, algebraic precision",
        learningActivities: [
          "Identifying the domain and range of fractional and radical functions",
          "Plotting and evaluating absolute value graphs of the form y = |ax + b|"
        ],
        expectedStandard: "Functions are represented correctly, and modulus values are evaluated."
      },
      {
        title: "10.3.2 Inverse and Composite Functions",
        competencies: [
          "Determine the inverse f⁻¹(x) of a one-to-one function",
          "Find composite functions such as fg(x) or g[f(x)]",
          "Sketch the graphs of a function and its inverse"
        ],
        knowledge: "Inverse f⁻¹(x) reverses the mapping of f(x) (domain of f becomes range of f⁻¹). Graph of f⁻¹(x) is the reflection of f(x) in the line y = x. Composite fg(x) applies g(x) first, then substitutes that output into f(x).",
        skills: "Algebraic inversion, composite substitution, geometric reflection sketching",
        values: "Logical sequencing, visual symmetry appreciation",
        learningActivities: [
          "Solving for the inverse of linear and rational functions",
          "Calculating composite functions and testing if fg(x) is equal to gf(x)"
        ],
        expectedStandard: "Inverses and composite expressions are algebraically derived and sketched."
      },
      {
        title: "10.3.3 Quadratic Functions, Equations, and Inequalities",
        competencies: [
          "Solve quadratic equations using completing the square and the quadratic formula",
          "Describe and apply the discriminant to find the nature of roots",
          "Determine maximum and minimum turning points of quadratic graphs",
          "Solve quadratic inequalities and determine their domains"
        ],
        knowledge: "Quadratic function f(x) = ax² + bx + c. Discriminant D = b² - 4ac determines roots: D > 0 (two real distinct roots), D = 0 (equal real roots), D < 0 (no real roots). Completing the square: a(x-h)² + k yields turning point (h, k). Inequalities are solved by finding critical values and analyzing signs.",
        skills: "Completing the square, root classification, turning point analysis, inequality domain determination",
        values: "Inquisitiveness in turning points, precision in roots classification, persistence",
        learningActivities: [
          "Expressing quadratic equations in vertex form to find the maximum/minimum coordinates",
          "Solving inequalities like x² - 5x + 6 < 0 and representing the solution domain on a number line"
        ],
        expectedStandard: "Quadratic equations, graphs, discriminants, and inequalities are fully solved and analyzed."
      }
    ]
  },
  {
    title: "10.4 Circular Measures",
    generalCompetency: "Understand radians as circular measures, convert between degrees and radians, and calculate arc length, chord length, sector and segment areas.",
    subtopics: [
      {
        title: "10.4.1 Radian Measure and Conversions",
        competencies: [
          "Describe a radian and convert radians to degrees and vice-versa",
          "Understand sub-units of circular measures (minutes, seconds)"
        ],
        knowledge: "One Radian is the angle subtended at the center of a circle by an arc equal in length to the radius. Relationship: π radians = 180°. Sub-units include minutes (1° = 60') and seconds (1' = 60'').",
        skills: "Unit conversion, angular manipulation, scale relating",
        values: "Precision in angular measurement, awareness of radian advantages in calculus",
        learningActivities: [
          "Converting angles like 45°, 90°, 120° into multiples of π radians",
          "Practicing conversion of fractional degrees with minutes and seconds into radians"
        ],
        expectedStandard: "Conversions between circular measures and degree coordinates are completed accurately."
      },
      {
        title: "10.4.2 Arc Length and Area of a Sector",
        competencies: [
          "Calculate the arc length subtended by an angle in radians",
          "Calculate the area of a sector of a circle",
          "Compute chord length, segment area, and circle perimeter elements"
        ],
        knowledge: "Arc length s = rθ (where θ is in radians). Area of a sector A = 0.5 × r²θ. Area of a triangle using two sides and included angle = 0.5 × ab sin θ. Area of a segment = Area of sector - Area of triangle = 0.5 × r²(θ - sin θ).",
        skills: "Sector area computation, chord length calculation, segment area determination",
        values: "Accuracy in compound geometric shapes, analytical visualization",
        learningActivities: [
          "Calculating the perimeter and area of shaded circular segments in complex geometries",
          "Solving for unknown radius or central angle given arc length or sector area values"
        ],
        expectedStandard: "Lengths and areas of circular sectors and segments are computed with high precision."
      }
    ]
  },
  {
    title: "10.5 Trigonometric Functions",
    generalCompetency: "Understand the six trigonometric functions, find ratios of special angles, draw trigonometric and modulus graphs, and solve trigonometric equations and identities.",
    subtopics: [
      {
        title: "10.5.1 Six Trigonometric Functions and Special Angles",
        competencies: [
          "Describe the six trigonometric functions and their reciprocal relationships",
          "Find exact trigonometric ratios of special angles (30°, 45°, 60°) from geometric triangles",
          "Determine trigonometric values across the four quadrant regions"
        ],
        knowledge: "Primary functions: Sin A, Cos A, Tan A. Reciprocal functions: Cosec A = 1/Sin A, Sec A = 1/Cos A, Cot A = 1/Tan A. Quadrant signs are governed by CAST rule. Special triangles (equilateral cut in half, or isosceles right-angled) yield exact values (e.g. Sin 30° = 1/2, Cos 45° = 1/√2).",
        skills: "Determining reciprocal ratios, quadrant mapping, exact ratio extraction",
        values: "Symmetrical logical reasoning, exactness in mathematical expressions",
        learningActivities: [
          "Deriving the exact values of sin, cos, tan, sec, cosec, cot for special angles from geometric figures",
          "Determining the coordinate quadrant and sign for angles like 210°, 300°, and 315°"
        ],
        expectedStandard: "The reciprocal and quadrant values of trigonometric functions are correctly identified and computed."
      },
      {
        title: "10.5.2 Graphs of Trigonometric and Modulus Functions",
        competencies: [
          "Draw graphs of trigonometric functions of the form y = b sin(kA), y = b cos(kA), and y = b tan(kA)",
          "Plot and solve trigonometric functions involving modulus"
        ],
        knowledge: "Trigonometric curves exhibit periodic characteristics: period, amplitude, phase shifts. Modulus graphs y = |f(x)| reflect portions of the curve below the x-axis to the positive y-axis.",
        skills: "Plotting periodic functions, modulus reflection drawing, analyzing amplitude and period",
        values: "Appreciation of periodic patterns, geometric visualization",
        learningActivities: [
          "Drawing curves for y = 2 sin(2x) and determining its period and amplitude",
          "Sketching y = |cos x| over the domain 0 to 2π"
        ],
        expectedStandard: "Periodic curves and absolute value trigonometric graphs are drawn and analyzed."
      },
      {
        title: "10.5.3 Trigonometric Equations and Identities",
        competencies: [
          "Solve basic and compound trigonometric equations",
          "Prove trigonometric identities using fundamental and compound angle formulas"
        ],
        knowledge: "Identities: Sin²A + Cos²A = 1, 1 + Tan²A = Sec²A, 1 + Cot²A = Cosec²A. Compound angle formulas: Sin(A ± B), Cos(A ± B), Tan(A ± B). Double angle formulas: Sin 2A, Cos 2A, Tan 2A. Equations of the form a cos θ + b sin θ = c solved by converting to R cos(θ - α).",
        skills: "Substituting identities, algebraic equation solving, proof formulation",
        values: "Curiosity in identities, logical step proofing, elegance in algebraic proof",
        learningActivities: [
          "Proving standard identities like (Sec²A - 1) / Sec²A = Sin²A",
          "Solving equations like 2 Cos²x - Sin x = 1 for the domain 0° to 360°"
        ],
        expectedStandard: "Trigonometric equations are solved, and standard identities are formally proved."
      }
    ]
  },
  {
    title: "10.6 Permutations and Combinations",
    generalCompetency: "Understand permutations and combinations, compute factorials, and solve arrangement and selection problems.",
    subtopics: [
      {
        title: "10.6.1 Factorials and Fundamental Counting Principles",
        competencies: [
          "Explain the meaning and calculate n factorial (n!)",
          "Solve basic linear arrangement and counting problems"
        ],
        knowledge: "Factorial n! = n × (n - 1) × ... × 1, where n is a whole number (0! = 1). Fundamental Counting Principle: if event A has p outcomes and B has q, the combined events have p × q outcomes.",
        skills: "Factorial computation, multiplication principle application",
        values: "Systematic counting, logical sequencing",
        learningActivities: [
          "Evaluating fractional factorials like 8! / (5! × 3!)",
          "Solving word problems on arranging books on a shelf or letters in a word"
        ],
        expectedStandard: "Factorial notation and fundamental counting principles are calculated correctly."
      },
      {
        title: "10.6.2 Permutations and Combinations Calculations",
        competencies: [
          "Differentiate between permutations (order matters) and combinations (order does not matter)",
          "Calculate permutations (ⁿPr) and combinations (ⁿCr) of n items taken r at a time",
          "Solve complex problems involving linear arrangements and group selections"
        ],
        knowledge: "Permutations formula: ⁿPr = n! / (n - r)!. Combinations formula: ⁿCr = n! / [r!(n - r)!]. Permutations apply to ordered sequences, while combinations apply to subsets/groups.",
        skills: "Arrangement and selection differentiation, algebraic formula evaluation",
        values: "Logical thinking in selection methods, precision, structured counting",
        learningActivities: [
          "Solving committee selection scenarios (e.g. choosing 3 girls and 2 boys from a pool of 10 students)",
          "Analyzing arrangements where specific items must be together or separated (restricted arrangements)"
        ],
        expectedStandard: "Arrangement and selection problems are correctly categorized, set up, and solved."
      }
    ]
  },
  {
    title: "10.7 Binomial Theorem",
    generalCompetency: "Understand the Binomial Theorem, construct Pascal's Triangle, and expand algebraic expressions to find specific terms.",
    subtopics: [
      {
        title: "10.7.1 Pascal's Triangle and Binomial expansions",
        competencies: [
          "Describe Pascal's Triangle and use it to find binomial coefficients",
          "Expand algebraic expressions of the form (a ± b)ⁿ using the Binomial Theorem",
          "Determine a specific term or coefficient in a binomial expansion"
        ],
        knowledge: "Binomial expansion: (a + b)ⁿ = ⁿC0 aⁿ + ⁿC1 aⁿ⁻¹b + ... + ⁿCn bⁿ. Pascal's Triangle generates coefficients for lower powers of n. General term in expansion is T_(r+1) = ⁿCr aⁿ⁻ʳ bʳ.",
        skills: "Expanding polynomials, calculating binomial coefficients, term targeting",
        values: "Perseverance in expansion calculations, pattern appreciation",
        learningActivities: [
          "Expanding binomial expressions like (2x - 3y)⁴ using coefficients from Pascal's triangle",
          "Finding the coefficient of the x⁵ term in the expansion of (x + 2/x)⁹"
        ],
        expectedStandard: "Binomial expansions are correctly evaluated, and target coefficients are identified."
      }
    ]
  }
];

export const obcAdditionalMathGrade11: Topic[] = [
  {
    title: "11.1 Remainder and Factor Theorem",
    generalCompetency: "Understand the Remainder and Factor theorems, factorise cubic and higher-order polynomials, and solve polynomial equations.",
    subtopics: [
      {
        title: "11.1.1 Remainder Theorem",
        competencies: [
          "State and explain the Remainder Theorem",
          "Find the quotient and remainder when a polynomial f(x) is divided by a linear divisor (ax + b)"
        ],
        knowledge: "Remainder Theorem: if a polynomial f(x) is divided by (ax + b), the remainder is f(-b/a). Long division or synthetic division yields the quotient Q(x) and remainder R such that f(x) = (ax + b)Q(x) + R.",
        skills: "Polynomial long division, synthetic division, remainder calculation",
        values: "Logical mathematical deduction, methodical algebraic steps",
        learningActivities: [
          "Dividing a cubic polynomial by linear factors to solve for remainders",
          "Solving for unknown constants in a polynomial given its remainder when divided by a linear factor"
        ],
        expectedStandard: "Remainders and quotients of polynomial divisions are correctly calculated using division and remainder theorems."
      },
      {
        title: "11.1.2 Factor Theorem and Polynomial Equations",
        competencies: [
          "Apply the Factor Theorem to find factors of polynomials",
          "Solve cubic and higher-degree polynomial equations",
          "Recognize and equate coefficients of identical polynomials"
        ],
        knowledge: "Factor Theorem: if f(-b/a) = 0, then (ax + b) is a factor of f(x). Once a factor is found, division reduces the polynomial to a quadratic which can be factored to find all roots. Identical polynomials have equal coefficients for matching powers of x.",
        skills: "Factoring higher-degree equations, equating coefficients, algebraic root solving",
        values: "Persistent problem solving, awareness of root relationships",
        learningActivities: [
          "Using the factor theorem to find one integer root of a cubic equation, then solving the remaining quadratic",
          "Equating coefficients of a known polynomial product to solve for undefined parameters"
        ],
        expectedStandard: "Polynomial equations are factored and solved for all real roots."
      }
    ]
  },
  {
    title: "11.2 Exponents and Logarithmic Functions",
    generalCompetency: "Understand and sketch exponential and logarithmic functions, convert equations between formats, and apply the laws of indices and logarithms.",
    subtopics: [
      {
        title: "11.2.1 Exponential and Logarithmic Graphs",
        competencies: [
          "Express exponential functions as logarithmic functions and vice versa",
          "Sketch graphs of the form y = aˣ and y = log_a(x), where a > 0, a ≠ 1",
          "Sketch natural exponential (y = eˣ) and natural logarithmic (y = ln x) graphs"
        ],
        knowledge: "Conversion relationship: y = aˣ ⇔ x = log_a(y). The logarithmic function is the reflection of the exponential function across the line y = x. Natural base e ≈ 2.718, natural log log_e(x) written as ln x.",
        skills: "Inter-converting exponents and logs, curve sketching, asymptote identification",
        values: "Aesthetic mapping accuracy, appreciation of exponential relationships",
        learningActivities: [
          "Plotting the inverse relationship between exponential and logarithmic curves on Cartesian grids",
          "Identifying vertical and horizontal asymptotes of shifted logarithmic functions"
        ],
        expectedStandard: "Exponential and logarithmic functions are converted and sketched."
      },
      {
        title: "11.2.2 Laws of Indices and Logarithms",
        competencies: [
          "Apply the laws of indices and logarithms to simplify mathematical expressions",
          "Solve index and logarithmic equations, including change-of-base applications"
        ],
        knowledge: "Laws of Logarithms: log(xy) = log x + log y; log(x/y) = log x - log y; log(xᵖ) = p log x. Change of base formula: log_b(a) = log_c(a) / log_b(b). Solve aˣ = b by taking logs of both sides.",
        skills: "Algebraic simplification, applying base-change formulas, logarithmic equation solving",
        values: "Logical precision, perseverance, structured algebraic operations",
        learningActivities: [
          "Simplifying expressions using multiple rules of indices and logarithms",
          "Solving equations like log_2(x) + log_2(x - 3) = 2"
        ],
        expectedStandard: "Logarithmic and index equations are solved and simplified using algebraic laws."
      }
    ]
  },
  {
    title: "11.3 Arithmetic and Geometric Progressions",
    generalCompetency: "Understand arithmetic and geometric sequences, compute terms, means, sums of progressions, and calculate sum to infinity of convergent GPs.",
    subtopics: [
      {
        title: "11.3.1 Arithmetic Progressions (A.P.)",
        competencies: [
          "Generate terms of an Arithmetic Progression",
          "Find the nth term (u_n) and number of terms in an A.P.",
          "Find the arithmetic mean between two numbers",
          "Calculate the sum of the first n terms (S_n) of an A.P."
        ],
        knowledge: "An A.P. has a constant common difference (d). Formulas: nth term u_n = a + (n - 1)d. Sum S_n = n/2 × [2a + (n - 1)d] = n/2 × [a + l]. Arithmetic mean of x and y is (x + y)/2.",
        skills: "Generating linear progressions, computing common differences, series summation",
        values: "Pattern recognition, logical thinking in linear sequences",
        learningActivities: [
          "Finding the sum of all odd integers between 50 and 150",
          "Determining the first term and common difference given two non-consecutive terms of an A.P."
        ],
        expectedStandard: "Terms, differences, and sums of arithmetic series are calculated."
      },
      {
        title: "11.3.2 Geometric Progressions (G.P.)",
        competencies: [
          "Generate terms of a Geometric Progression",
          "Find the nth term (u_n) and geometric mean between two numbers",
          "Calculate the sum of the first n terms (S_n) of a G.P.",
          "Determine the sum to infinity (S_∞) of a convergent G.P. (|r| < 1)"
        ],
        knowledge: "A G.P. has a constant common ratio (r). Formulas: nth term u_n = a rⁿ⁻¹. Sum S_n = a(1 - rⁿ) / (1 - r) for r < 1. Geometric mean of x and y is √(xy). Sum to infinity S_∞ = a / (1 - r) exists only if |r| < 1.",
        skills: "Exponential series generation, ratio calculation, summation, sum-to-infinity evaluation",
        values: "Curiosity in infinity limits, appreciation of convergent series patterns",
        learningActivities: [
          "Calculating the total distance traveled by a bouncing ball using sum to infinity",
          "Comparing arithmetic and geometric growth scales with numerical charts"
        ],
        expectedStandard: "Geometric terms, means, sums, and infinite limits are correctly computed."
      }
    ]
  },
  {
    title: "11.4 Differentiation",
    generalCompetency: "Understand the concept of a derived function, apply differentiation rules (product, quotient, chain rule) to algebraic, trigonometric and exponential functions, and solve optimization problems.",
    subtopics: [
      {
        title: "11.4.1 Rules of Differentiation",
        competencies: [
          "Find the derivative of a polynomial using the Power Rule",
          "Apply the Product Rule, Quotient Rule, and Chain Rule to algebraic expressions",
          "Differentiate exponential (eᵏˣ) and trigonometric (sin kx, cos kx, tan kx) functions",
          "Calculate the second derivative (d²y/dx²)"
        ],
        knowledge: "Power rule: d/dx(xⁿ) = n xⁿ⁻¹. Product rule: d/dx(uv) = u dv/dx + v du/dx. Quotient rule: d/dx(u/v) = (v du/dx - u dv/dx) / v². Chain rule: dy/dx = dy/du × du/dx. Trigonometric derivatives: d/dx(sin x) = cos x, d/dx(cos x) = -sin x.",
        skills: "Executing differentiation rules, chain variable substitution, calculating second-order derivatives",
        values: "Mathematical precision, logical step formulation, awareness of rates of change",
        learningActivities: [
          "Differentiating complex rational algebraic expressions using the quotient and chain rules",
          "Finding the second derivative of trigonometric functions like f(x) = cos(3x)"
        ],
        expectedStandard: "Derivatives of composite, trigonometric, and exponential expressions are correctly derived."
      },
      {
        title: "11.4.2 Applications of Differentiation",
        competencies: [
          "Determine the gradient of a curve at a given coordinate",
          "Find equations of tangents and normals to a curve at a point",
          "Locate stationary points and analyze their nature (maxima, minima, inflection) using first or second derivative tests",
          "Solve rate of change, small increment, and kinematics problems (velocity and acceleration)"
        ],
        knowledge: "Gradient of tangent is dy/dx. Gradient of normal is -1/(dy/dx). At stationary points, dy/dx = 0. Nature of turning points: d²y/dx² < 0 (maximum), d²y/dx² > 0 (minimum), d²y/dx² = 0 (test further/inflection). Kinematics: s (displacement) ⇒ ds/dt = v (velocity) ⇒ dv/dt = a (acceleration).",
        skills: "Tangent and normal slope calculations, stationary point classification, rates of change calculations",
        values: "Logical reasoning, accuracy in optimization, deciveness",
        learningActivities: [
          "Finding the minimum dimensions of a container to maximize volume while minimizing material cost",
          "Determining the velocity and acceleration of a particle at time t given its displacement equation"
        ],
        expectedStandard: "Gradients, tangents, normals, and turning points are solved, and optimization problems are resolved."
      }
    ]
  },
  {
    title: "11.5 Integration",
    generalCompetency: "Understand integration as the reverse process of differentiation, compute indefinite and definite integrals, calculate areas under and between curves, and compute volumes of solids of revolution.",
    subtopics: [
      {
        title: "11.5.1 Indefinite and Definite Integration",
        competencies: [
          "Integrate terms of integer powers (excluding 1/x)",
          "Integrate polynomials with fractional and rational powers",
          "Evaluate definite integrals using upper and lower limits"
        ],
        knowledge: "Integration rule: ∫ xⁿ dx = (xⁿ⁺¹) / (n + 1) + c (for n ≠ -1). Definite integral ∫_a^b f(x) dx = F(b) - f(a). Indefinite integration yields a family of curves with constant c, resolved given a boundary point.",
        skills: "Reverse power rules calculation, fractional exponent integration, definite integral limits subtraction",
        values: "Methodical execution, precision in limits, curiosity in inverse operations",
        learningActivities: [
          "Evaluating indefinite integrals and finding the constant of integration using boundary conditions",
          "Calculating the value of definite integrals like ∫_1⁴ (x√x) dx"
        ],
        expectedStandard: "Indefinite and definite integrals are computed and evaluated correctly."
      },
      {
        title: "11.5.2 Applications of Integration (Area and Volume)",
        competencies: [
          "Calculate the area of a region bounded by a curve and an axis",
          "Find the area of a region bounded between two intersecting curves",
          "Calculate the volume of a solid of revolution formed by rotating a region through 360° about the x or y-axis",
          "Solve kinematics displacement problems by integrating velocity functions"
        ],
        knowledge: "Area under curve A = ∫_a^b y dx. Area between curves A = ∫_a^b (y_top - y_bottom) dx. Volume of revolution about x-axis V = π ∫_a^b y² dx. Volume of revolution about y-axis V = π ∫_c^d x² dy. Displacement s = ∫ v dt; Velocity v = ∫ a dt.",
        skills: "Definite integral boundary mapping, area summation, volume integration, integrating motion variables",
        values: "Spatial perception of 3D solids, logical reasoning, accuracy in integration boundaries",
        learningActivities: [
          "Finding the exact area bounded between the line y = x and the parabola y = x²",
          "Calculating the volume generated when the curve y = x³ from x = 0 to 2 is rotated 360° about the x-axis"
        ],
        expectedStandard: "Areas, volumes of solids of revolution, and displacement variables are calculated."
      }
    ]
  }
];

export const obcAdditionalMathGrade12: Topic[] = [
  {
    title: "12.1 Vectors in Two Dimensions",
    generalCompetency: "Define vectors, utilize standard vector notations, execute vector addition/subtraction, calculate dot products, find angles, and formulate vector equations of straight lines.",
    subtopics: [
      {
        title: "12.1.1 Vector Operations and Notation",
        competencies: [
          "Define a vector and utilize standard notation (<u>a</u>, AB, ai + bj)",
          "Perform vector addition, subtraction, and scalar multiplication",
          "Determine magnitude |<u>a</u>| and find unit vectors"
        ],
        knowledge: "A vector has both magnitude and direction. Vector <u>a</u> = x<u>i</u> + y<u>j</u>. Magnitude |<u>a</u>| = √(x² + y²). Unit vector in direction of <u>a</u> is <u>a</u> / |<u>a</u>|. Scalar multiplication scales magnitude without altering fundamental direction.",
        skills: "Vector addition/subtraction, magnitude computation, unit vector derivation",
        values: "Precision in directional coordinates, appreciation of vector systems in mechanics",
        learningActivities: [
          "Calculating resulting vector displacements given multiple coordinate components",
          "Finding unit vectors for vector fields like 3<u>i</u> - 4<u>j</u>"
        ],
        expectedStandard: "Vector operations, magnitudes, and unit directions are calculated accurately."
      },
      {
        title: "12.1.2 Scalar Product and Vector Line Equations",
        competencies: [
          "Calculate the scalar (dot) product of two vectors",
          "Use the dot product to find the angle between two vectors",
          "Identify perpendicular vectors using the property <u>a</u> • <u>b</u> = 0",
          "Formulate and apply the vector equation of a straight line"
        ],
        knowledge: "Scalar product <u>a</u> • <u>b</u> = a1b1 + a2b2 = |<u>a</u>||<u>b</u>| cos θ. If vectors are perpendicular, θ = 90° ⇒ cos θ = 0 ⇒ <u>a</u> • <u>b</u> = 0. Vector equation of a line: <u>r</u> = <u>a</u> + t<u>d</u>, where <u>a</u> is a position vector and <u>d</u> is a direction vector.",
        skills: "Dot product computation, angular evaluation, vector line equation formulation",
        values: "Logical mathematical deduction, precision, geometrical connection insight",
        learningActivities: [
          "Calculating the angle between vectors 2<u>i</u> + <u>j</u> and -<u>i</u> + 3<u>j</u>",
          "Deriving the vector equation of a straight line passing through two coordinate positions"
        ],
        expectedStandard: "Angles between vectors, orthogonal properties, and vector equations of lines are solved."
      }
    ]
  },
  {
    title: "12.2 Statistics and Measures of Dispersion",
    generalCompetency: "Construct cumulative frequency tables and curves, find range, quartiles, percentiles, and calculate mean, variance, and standard deviation for grouped and ungrouped data.",
    subtopics: [
      {
        title: "12.2.1 Statistical Presentation and Frequency Curves",
        competencies: [
          "Construct cumulative frequency tables",
          "Draw cumulative frequency curves (ogives)",
          "Differentiate discrete and random variables"
        ],
        knowledge: "Cumulative frequency sums frequencies progressively. An ogive plots cumulative frequency against class upper boundaries, forming an S-shaped curve.",
        skills: "Data grouping, class boundary mapping, curve drawing",
        values: "Accuracy in statistical presentation, graphical precision",
        learningActivities: [
          "Grouping raw mark scores into class intervals and calculating cumulative frequencies",
          "Plotting an ogive curve on graph paper and checking its smooth contours"
        ],
        expectedStandard: "Cumulative frequency curves are plotted with accurate boundaries."
      },
      {
        title: "12.2.2 Measures of Dispersion",
        competencies: [
          "Find range, quartiles, percentiles, and the inter-quartile range from statistical curves",
          "Calculate mean, variance, and standard deviation for grouped and ungrouped data"
        ],
        knowledge: "Range is difference between max and min. Inter-quartile range (IQR) = Q3 - Q1 (where Q1 is 25th percentile, Q3 is 75th percentile). Mean x̄ = Σfx / Σf. Variance σ² = Σf(x - x̄)² / Σf = [Σfx² / Σf] - x̄². Standard deviation σ = √Variance.",
        skills: "Reading percentiles from graphs, calculating variance and standard deviation using formulas",
        values: "Computational accuracy, analytical logic, systematic data classification",
        learningActivities: [
          "Estimating the median and IQR of grouped mark sheets using an ogive curve",
          "Calculating the standard deviation of grouped examination marks using frequency formulas"
        ],
        expectedStandard: "Mean, variance, standard deviation, and quartile ranges of grouped data are correctly calculated."
      }
    ]
  }
];
