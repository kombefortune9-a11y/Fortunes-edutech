import { Topic } from './syllabi';

export const obcComputerStudiesGrade10: Topic[] = [
  {
    title: "10.1 Computer Career Opportunities",
    generalCompetency: "Demonstrate an understanding of different careers in ICT and identify further educational opportunities.",
    subtopics: [
      {
        title: "10.1.1 Careers in ICT",
        competencies: [
          "Describe different careers in ICT",
          "Identify roles of computer operator, programmer, software engineer, web designer, and computer technician"
        ],
        knowledge: "Careers in ICT include: Computer operator, Programmer (writing code), Software engineer (designing and constructing software systems), Web Designer (creating websites), and Computer Technician (maintaining and repairing hardware).",
        skills: "Interpretation of ICT careers, career mapping, goal setting",
        values: "Appreciation of ICT careers, awareness of professional responsibility, inquisitiveness in ICT jobs",
        learningActivities: [
          "Brainstorming different jobs in the computer industry and matching descriptions to roles",
          "Discussing the daily duties of computer technicians and programmer professionals"
        ],
        expectedStandard: "A clear understanding of diverse ICT career paths and their professional scopes is demonstrated."
      },
      {
        title: "10.1.2 Further Educational Opportunities",
        competencies: [
          "Identify opportunities for further education in computer fields"
        ],
        knowledge: "Further education paths include colleges, polytechnics, universities, and dedicated research institutions offering certifications, diplomas, and degrees in computer science and information technology.",
        skills: "Identification of educational paths, research of requirements",
        values: "Enjoyment of lifelong learning, forward-thinking, curiosity",
        learningActivities: [
          "Researching tertiary institutions in Zambia that offer specialized computer studies programs",
          "Mapping out personal learning plans from secondary level to professional certifications"
        ],
        expectedStandard: "Clear academic progression routes for IT professions are correctly mapped."
      }
    ]
  },
  {
    title: "10.2 Application Software",
    generalCompetency: "Promote an appreciation of the range and power of computer applications, and distinguish custom and bespoke software setups.",
    subtopics: [
      {
        title: "10.2.1 Generic Application Software",
        competencies: [
          "Understand the difference between application software and system software",
          "Classify types of software and outline the usage of different types"
        ],
        knowledge: "Application software performs specific user tasks (e.g. Word, Excel) while system software manages the hardware (e.g. Windows, Linux). Generic software is off-the-shelf, while bespoke software is custom-built for specific clients. Integrated software bundles multiple apps, whereas stand-alone is single-purpose.",
        skills: "Differentiation between application and system software, classification of packages",
        values: "Understanding software scopes, precision in software usage, inquisitiveness",
        learningActivities: [
          "Categorizing a given list of programs into system software or application software",
          "Discussing the pros and cons of using integrated software packages vs. stand-alone applications"
        ],
        expectedStandard: "Systems and application software programs are cleanly distinguished and classified."
      },
      {
        title: "10.2.2 Software Customisation and Bespoke Systems",
        competencies: [
          "Understand how generic application software may be customised by the use of macros and formulae",
          "Appreciate the advantages and disadvantages of generic application software compared with bespoke software",
          "Distinguish between off-the-shelf and in-house software"
        ],
        knowledge: "Generic software can be customized using formulas and macros to automate tasks. Off-the-shelf software is cheaper and instantly available but might contain unused features. Bespoke (in-house) software is tailored perfectly to an organization's needs but is expensive and takes time to develop.",
        skills: "Customisation planning, evaluating software options, macro design logic",
        values: "Teamwork in application, inquisitiveness in spreadsheet customization, critical thinking",
        learningActivities: [
          "Demonstrating customization of a spreadsheet template using logic conditions e.g. IF(C5>300, C5*5%, 'No Discount')",
          "Comparing a business using a generic retail billing app vs. developing their own in-house inventory system"
        ],
        expectedStandard: "The benefits and trade-offs of off-the-shelf vs. customized or bespoke software systems are thoroughly evaluated."
      }
    ]
  },
  {
    title: "10.3 Hardware of the Computer System",
    generalCompetency: "Investigate and demonstrate understanding of input, processing, and output hardware components of a computer system.",
    subtopics: [
      {
        title: "10.3.1 Input Devices and Stage",
        competencies: [
          "Investigate different types of input devices and demonstrate their usage",
          "Describe the elements of the input stage"
        ],
        knowledge: "Input devices convert human-understandable data into a digital format. Types: mouse, keyboard, scanner, Optical Character Reader (OCR), Magnetic Ink Character Reader (MICR - used in banking checks), Optical Mark Reader (OMR), and special purpose input devices for people with special needs.",
        skills: "Device discrimination, inputting data, device manipulation",
        values: "Critical thinking on input stage connections, accuracy, accessibility appreciation",
        learningActivities: [
          "Matching various input devices to their specialized real-world environments (e.g., OMR for grading multiple-choice exams)",
          "Demonstrating and comparing document scanning vs. OCR text conversion"
        ],
        expectedStandard: "A variety of standard and special-purpose input hardware devices are correctly identified and matched to applications."
      },
      {
        title: "10.3.2 Elements of the Process Stage",
        competencies: [
          "Identify registers within the processor",
          "Demonstrate the principle of the Fetch-Execute cycle",
          "Identify elements of the process stage (memory, control unit, arithmetic and logic unit - ALU)"
        ],
        knowledge: "The process stage occurs in the Central Processing Unit (CPU). It contains the Control Unit (CU - directs data), ALU (handles logic and math), Memory (RAM/ROM), and specialized internal Registers (temporary storage cells). The Fetch-Execute cycle is the basic operational process of retrieving, decoding, and running instructions.",
        skills: "CPU structure mapping, modeling process cycles, identifying register roles",
        values: "Logical thinking in process stages, problem solving in data fetching",
        learningActivities: [
          "Drawing a block diagram of the CPU showing CU, ALU, memory, and internal register connections",
          "Simulating the step-by-step Fetch-Execute cycle with a simple manual model"
        ],
        expectedStandard: "The internal architecture of the CPU and the mechanics of the fetch-execute cycle are clearly explained."
      },
      {
        title: "10.3.3 Output Devices and Stage",
        competencies: [
          "Identify types of output devices and distinguish their usages"
        ],
        knowledge: "Output devices present processed data to the user. Types: printers (impact and non-impact), monitors (CRT, LCD, LED), LCD projectors, speakers, and special purpose output devices for people with special needs.",
        skills: "Distinguishing between output formats, evaluating display technologies",
        values: "Accessibility awareness, appreciation of visual quality",
        learningActivities: [
          "Listing and contrasting different printer types based on speed, cost, and print quality",
          "Discussing output devices tailored for blind or visually impaired users (e.g., Braille embossers, speech synthesis)"
        ],
        expectedStandard: "Various computer output hardware items are distinguished according to performance and utility."
      }
    ]
  },
  {
    title: "10.4 Operating Systems and File Management",
    generalCompetency: "Analyze operating system types, functions, user interfaces, and demonstrate efficient file/folder organization and data backup procedures.",
    subtopics: [
      {
        title: "10.4.1 Introduction to Operating Systems",
        competencies: [
          "Outline different types of operating systems and describe their functions",
          "Describe different types of user interface"
        ],
        knowledge: "An operating system (OS) controls the computer's hardware and software resources. Types include command-line interfaces (CLI) and graphical user interfaces (GUI). Key functions: task scheduling, memory management, file organization, security, and peripheral device control.",
        skills: "OS discrimination, interface evaluation, command execution",
        values: "Inquisitiveness in OS usage, systemic thinking, appreciation of UI design",
        learningActivities: [
          "Comparing the experience of running commands in a CLI (like Command Prompt) vs. using a GUI (Windows desktop)",
          "Listing the background tasks of the OS, such as memory allocation when running multiple apps"
        ],
        expectedStandard: "Operating system tasks and interface types are correctly analyzed and differentiated."
      },
      {
        title: "10.4.2 File Management and Backups",
        competencies: [
          "Describe types of file organisation and access",
          "Explain how folders are structured and how folders and files can be managed",
          "Explain the principles of backing up data (backup, restore)"
        ],
        knowledge: "File organization includes sequential, direct, random, and serial access formats. Files and folders are organized hierarchically. Backing up is copying data to a safe secondary location; restoring is copying it back if the original is lost. Communication with peripheral devices is managed by drivers to maintain data integrity.",
        skills: "Hierarchical file structure creation, backup scheme planning, data recovery",
        values: "Responsibility in data integrity, awareness of data safety, organizational discipline",
        learningActivities: [
          "Creating a logical multi-level folder hierarchy to organize classroom documents",
          "Simulating a data backup process to a USB drive and practicing file restoration"
        ],
        expectedStandard: "Standard directory organization structures and security backup protocols are accurately demonstrated."
      }
    ]
  },
  {
    title: "10.5 Presentation Packages",
    generalCompetency: "Demonstrate practical proficiency in using presentation packages to format slides, add animations, and deliver professional slide shows.",
    subtopics: [
      {
        title: "10.5.1 Creating and Formatting Slides",
        competencies: [
          "Illustrate the general features of a Presentation Package",
          "Demonstrate various methods of creating and formatting slides"
        ],
        knowledge: "Presentation software (e.g. PowerPoint) utilizes slides to present information visually. Key features include templates, layout choices, text formatting, slide sorting, and slide master configurations.",
        skills: "Manipulation of presentation packages, slide creation, text layout formatting",
        values: "Accuracy in design layouts, productivity, artistic layout alignment",
        learningActivities: [
          "Using a software template to construct a 5-slide educational presentation on basic computer hardware",
          "Applying a consistent design theme, editing slide master slides, and re-ordering files using the Slide Sorter view"
        ],
        expectedStandard: "A well-structured, formatted slide presentation is created according to standard design layouts."
      },
      {
        title: "10.5.2 Animations and Delivery",
        competencies: [
          "Describe the steps in adding animations and slide transitions",
          "Demonstrate slide show delivery techniques"
        ],
        knowledge: "Animations control how individual elements appear on a slide (entrance, emphasis, exit). Slide transitions control how the slide show moves from one slide to the next, enhancing visual engagement.",
        skills: "Adding entrance animations, setting slide transitions, managing delivery timing",
        values: "Logical thinking in animation usage, professional presentation delivery",
        learningActivities: [
          "Configuring entrance and emphasis animation effects on bullet points",
          "Setting slide transition delays and delivering a timed presentation to the class"
        ],
        expectedStandard: "Slide transitions and custom animations are applied to enhance presentation quality without creating distractions."
      }
    ]
  },
  {
    title: "10.6 General Computer Applications",
    generalCompetency: "Investigate and analyze general computer applications in home, office, and commercial environments, and outline different data processing modes.",
    subtopics: [
      {
        title: "10.6.1 Applications in Different Environments",
        competencies: [
          "Demonstrate an understanding of computer applications in a home environment, offices, and commercial environments"
        ],
        knowledge: "Computers are embedded in household appliances (washing machines, entertainment centers). Offices utilize computers for communication (Internet, Intranets), document processing, and records. Commercial environments use computers for point of sale (POS) billing, stock controls, traffic management, and training systems.",
        skills: "Identification of computer applications, system evaluation",
        values: "Appreciation of communication systems, critical thinking on automation impact",
        learningActivities: [
          "Conducting a field study or brainstorming session on how computers are used in retail stores (POS, barcode scanners, inventory logs)",
          "Discussing how embedded computer processors improve the energy efficiency of home appliances"
        ],
        expectedStandard: "The widespread usage of computer applications in domestic, office, and retail settings is fully explained."
      },
      {
        title: "10.6.2 Data Processing Modes",
        competencies: [
          "Identify general data processing, industrial, technical, and scientific uses of computers"
        ],
        knowledge: "Computers process data in various modes: batch processing (collecting jobs and running them all at once), interactive/real-time processing (immediate feedback), and control systems (monitoring sensors and reacting). Industrial and scientific computers are used for simulations, forecasting, and process control.",
        skills: "Data processing mode classification, identifying control loops",
        values: "Precision in processing definitions, scientific awareness",
        learningActivities: [
          "Categorizing given computing tasks into batch processing (e.g. monthly payroll billing) or real-time processing (e.g. airline ticket reservation)",
          "Investigating how temperature sensors and microprocessors form a closed-loop climate control system"
        ],
        expectedStandard: "The differences between batch, interactive, and automated control processing modes are clearly outlined."
      }
    ]
  },
  {
    title: "10.7 Computer Security (Assets)",
    generalCompetency: "Define computer security terminologies, analyze system security layers, and examine the responsibilities of computer security professionals.",
    subtopics: [
      {
        title: "10.7.1 Security Terminology and Layers",
        competencies: [
          "Describe computer security terminologies",
          "Describe the systems security policy structure and layers"
        ],
        knowledge: "Computer security covers protecting hardware, software, and data assets from unauthorized access or destruction. Key concepts: authentication, encryption, firewall, malware, and system security policies. A security policy is an administrative framework outlining user rights, access rules, and backup frequencies.",
        skills: "Security layer identification, policy analysis, terminology definition",
        values: "Responsibility in data security, awareness of security layers",
        learningActivities: [
          "Defining common terms like hacking, phishing, encryption, and firewalls",
          "Drafting a sample school computer lab security policy including password guidelines and storage rules"
        ],
        expectedStandard: "Security terminologies and the layers of a system security policy are correctly described."
      },
      {
        title: "10.7.2 Security Concerns and Professionals",
        competencies: [
          "Describe and resolve various security concerns towards resources",
          "Identify computer security professionals and explain their responsibilities"
        ],
        knowledge: "Security concerns include unauthorized data access, theft of devices, and surveillance of staff. Security professionals (security architects, penetration testers, network administrators) have the responsibility to design secure networks, monitor logs, run vulnerability scans, and implement access privileges.",
        skills: "Security concern mitigation, analyzing professional roles, surveillance evaluation",
        values: "Inquisitiveness in defense measures, professional ethics, security consciousness",
        learningActivities: [
          "Reviewing common methods to secure physical computer resources (keycard locks, cable ties, security cameras)",
          "Discussing the ethical responsibilities of security professionals who have access to private user data"
        ],
        expectedStandard: "Strategies to address asset security concerns and the duties of security staff are explained."
      }
    ]
  }
];

export const obcComputerStudiesGrade11: Topic[] = [
  {
    title: "11.1 Programming and Pseudo Code Algorithms",
    generalCompetency: "Identify programming terminologies and structures in Pascal/C++, write algorithms in pseudo-code, construct trace tables, and dry-run code blocks.",
    subtopics: [
      {
        title: "11.1.1 Programming Terminology and Structures",
        competencies: [
          "Identify programming terminology in Pascal and C++",
          "Identify basic program structures and reserved words"
        ],
        knowledge: "Programming terminology: source code, compiler (translates whole code), interpreter (translates line-by-line), assembler, variables, and data types. Basic program structure includes: program header, variable declarations, and main execution block. Pascal reserved words include: BEGIN, READLN, WRITELN, END. C++ uses: int, cin, cout, main().",
        skills: "Reserved word identification, program structure parsing, compiler usage",
        values: "Logical thinking in programming, appreciation of code syntax, precision",
        learningActivities: [
          "Examining a simple 'Hello World' program in both Pascal and C++ and pointing out the variables, headers, and main body statements",
          "Differentiating between compiled languages (C++) and interpreted scripting languages"
        ],
        expectedStandard: "Syllabus compilers (Turbo Pascal and C++) structures and key terminology are accurately defined."
      },
      {
        title: "11.1.2 Pre-defined and User-defined Data Types",
        competencies: [
          "Identify pre-defined data types and declare variables",
          "Create user-defined data types"
        ],
        knowledge: "Pre-defined data types include Integer, Real (float), Character (char), and Boolean. Variable declaration reserves memory for a specific type. User-defined data types allow programmers to construct custom structures, subranges, or enumerated lists (e.g. DaysOfWeek = (Mon, Tue, Wed)). Data structures include arrays, records, files, and sets.",
        skills: "Variable declaration, choosing appropriate data types, data structure modeling",
        values: "Accuracy in data type matching, structural discipline",
        learningActivities: [
          "Writing code snippets in Pascal or C++ declaring integer, character, and floating-point variables",
          "Designing a custom 'Record' data structure to store student profiles (Name, Class, Mark)"
        ],
        expectedStandard: "Pre-defined and user-defined data types are correctly declared and structured in syntax."
      },
      {
        title: "11.1.3 Loops, Decisions, and Pseudo-Code Algorithms",
        competencies: [
          "Produce an algorithm for a given problem in pseudocode using structures, totalling, and counting",
          "Produce loops and decision making in a program"
        ],
        knowledge: "Pseudo-code algorithms use standard English structures to represent logic. Structures include: Selection (IF...THEN...ELSE...ENDIF, CASE...OF...OTHERWISE...ENDCASE) and Iteration (REPEAT...UNTIL, WHILE...DO...ENDWHILE, FOR...END FOR). Totalling accumulates values (sum = sum + number); counting increments by one (count = count + 1).",
        skills: "Pseudo-code design, loop construction, logic modeling, totaling and counting algorithms",
        values: "Productivity, problem solving, creative logic development",
        learningActivities: [
          "Writing a pseudo-code algorithm that reads ten numbers, calculates their sum, and outputs the average",
          "Drafting selection logic for a grade calculator using Nested IF statements or CASE structures"
        ],
        expectedStandard: "Detailed pseudo-code algorithms containing loops and logical selections are successfully written."
      },
      {
        title: "11.1.4 Dry-running and Trace Tables",
        competencies: [
          "Use a dry run with a trace table and test data to understand the behaviour of code",
          "Construct trace tables for pseudo-code and work out the purpose of an algorithm"
        ],
        knowledge: "Dry-running is executing code manually step-by-step. A trace table records the values of variables at each step of execution, helping programmers locate logic errors or trace algorithm outputs using sample test data.",
        skills: "Trace table construction, manual dry-running, debugging, logic tracing",
        values: "Critical and analytical thinking in debugging, precision, attention to detail",
        learningActivities: [
          "Constructing a trace table to find the final output of a loop algorithm with input data [5, 12, 8]",
          "Locating a logic bug (such as an infinite loop or off-by-one boundary error) in a given pseudo-code block by dry-running it with a trace table"
        ],
        expectedStandard: "Trace tables are accurately constructed and used to dry-run and debug program logic."
      }
    ]
  },
  {
    title: "11.2 Logic Gates, Circuits and Website Designing",
    generalCompetency: "Understand logic gate functions/symbols, build truth tables and logic circuits, and design simple websites using HTML and Dreamweaver.",
    subtopics: [
      {
        title: "11.2.1 Logic Gates and Truth Tables",
        competencies: [
          "Define functions of five types of logic gates and recognise their symbols",
          "Write a truth table for a given gate and recognise a gate from its truth table"
        ],
        knowledge: "Logic gates process binary inputs (0 and 1). Five main gates: AND (outputs 1 if all inputs are 1), OR (outputs 1 if any input is 1), NOT (inverts input), NAND (inverted AND), and NOR (inverted OR). Truth tables systematically list all input combinations and outputs.",
        skills: "Gate symbol recognition, truth table formulation, logic gate discrimination",
        values: "Accuracy in truth tables, logical rigor",
        learningActivities: [
          "Drawing schematic symbols for AND, OR, NOT, NAND, and NOR gates",
          "Formulating the truth table for each of the five gates and identifying gates from output patterns"
        ],
        expectedStandard: "Logic gate symbols are accurately drawn and their truth tables are cleanly calculated."
      },
      {
        title: "11.2.2 Logic Circuits",
        competencies: [
          "Produce a truth table for a given logic circuit",
          "Design a simple logic circuit to provide a solution to a written logical statement"
        ],
        knowledge: "Logic circuits combine multiple logic gates to solve a complex logical problem (e.g., combinational logic circuits with two or three inputs). Written statements (e.g. 'Alarm is active if door is open AND key is NOT turned') are translated into boolean expressions and gate diagrams.",
        skills: "Circuit diagram design, combinational logic truth table calculation, logical modeling",
        values: "Systematic problem solving, accuracy in logic circuit design",
        learningActivities: [
          "Drafting a logic circuit diagram for a safety system involving three binary inputs",
          "Calculating the complete 8-row truth table for a combinational logic circuit containing AND, OR, and NOT gates"
        ],
        expectedStandard: "Combinational logic circuits are correctly designed and mapped to their exact truth tables."
      },
      {
        title: "11.2.3 Website Design and Development",
        competencies: [
          "Create Web Pages using templates, HTML, and design software",
          "Import text and pictures in a web designer and use animations on websites"
        ],
        knowledge: "Website design involves creating structured pages using templates, HTML coding, or authoring tools (like Dreamweaver). Elements: text, images, hyperlink connections, stylesheets, and animations (such as using Flash or modern video embeds to animate components).",
        skills: "HTML coding, website layouts structuring, media importation, web layout previewing",
        values: "Entrepreneurship in web design, appreciation of web standards, inquisitiveness",
        learningActivities: [
          "Creating a basic webpage layout about school events using HTML tags or design templates",
          "Importing images, setting up hyperlinks, and previewing the final webpage layout in a web browser"
        ],
        expectedStandard: "A functional multi-page web layout with imported media and logical links is successfully created."
      }
    ]
  },
  {
    title: "11.3 Networks and Data Communication",
    generalCompetency: "Examine computer networks, topologies, communication media, data capture/checking, data protection, security, and viruses.",
    subtopics: [
      {
        title: "11.3.1 Networks and Topologies",
        competencies: [
          "Define computer networks and explain their purposes and limitations",
          "Identify elements of networks and describe network topologies"
        ],
        knowledge: "A computer network is two or more devices connected to share resources and communicate. Purpose: resource sharing, remote communication, centralized processing, and cost-effectiveness. Limitations: security risks, network failures, installation costs. Topologies: Star, Bus, Ring, Mesh, Tree. Media includes physical cables (UTP, Fiber optic) and wireless (Wi-Fi, Bluetooth).",
        skills: "Network topology mapping, networking hardware selection, performance evaluation",
        values: "Appreciation of network utility, awareness of connectivity benefits, critical planning",
        learningActivities: [
          "Drawing and comparing Star, Bus, and Ring network topologies, noting failure points",
          "Listing networking hardware components (modems, network interface cards, switches, routers) and their functions"
        ],
        expectedStandard: "The benefits and topologies of local area networks are correctly illustrated."
      },
      {
        title: "11.3.2 Data Capture, Checking, and Signal Conversion",
        competencies: [
          "Explain analogue-to-digital and digital-to-analogue conversion",
          "Identify methods of data capture and checking"
        ],
        knowledge: "Analogue signals (continuous waves) must be converted to digital signals (discrete binary) for computers to process, and vice-versa, using Modulator-Demodulators (Modems). Data capture captures raw inputs; data checking verifies integrity using validation (rules checking: range, format, limit checks) and verification (matching original data: double-entry, visual checks).",
        skills: "Signal analysis, choosing validation rules, designing double-entry systems",
        values: "Precision in data verification, maintenance of data integrity",
        learningActivities: [
          "Discussing why modems are required to connect computer networks over telephone lines",
          "Designing data validation rules for a student registration form (e.g., limit check on birth year)"
        ],
        expectedStandard: "Validation and verification methods and signal conversion concepts are clearly distinguished."
      },
      {
        title: "11.3.3 Computer Security, Crime, and Internet Security",
        competencies: [
          "Identify computer crime and demonstrate data protection legislation requirements",
          "Discuss consequences of computer viruses and identify internet security protocols"
        ],
        knowledge: "Computer crime covers hacking, data theft, and unauthorized manipulation. Data protection legislation establishes principles of data privacy and user rights. Viruses (malware) corrupt files, steal data, or crash systems; mitigated using Antiviruses. Internet security uses firewalls, secure protocols (HTTPS), and user education.",
        skills: "Threat threat assessment, malware removal techniques, legal compliance mapping",
        values: "Ethics in computer usage, security consciousness, awareness of laws",
        learningActivities: [
          "Analyzing a real-world computer crime case study to identify which security layers failed",
          "Discussing the core requirements of data protection acts (fair use, secure storage, access rights)"
        ],
        expectedStandard: "Computer security threats, antivirus protections, and data legislation standards are fully examined."
      }
    ]
  },
  {
    title: "11.4 Computer System and Applications",
    generalCompetency: "Distinguish types of computer systems, analyze monitoring and control systems, and examine automation, expert systems, and AI applications.",
    subtopics: [
      {
        title: "11.4.1 Types of Computer Systems and Support",
        competencies: [
          "Distinguish between different types of computer systems",
          "Illustrate what is needed to support various computer systems"
        ],
        knowledge: "Computer systems are categorized by their processing behaviors: batch processing (automated runs, e.g. billing), interactive systems (direct user dialogue), control systems (continuous monitoring of processes), and automated systems.",
        skills: "Computer system classification, matching hardware support, process evaluation",
        values: "Systemic thinking, productivity",
        learningActivities: [
          "Matching different processing systems to their appropriate support environments (e.g. interactive systems for POS terminals)",
          "Investigating the hardware support needed for on-line services and remote databases"
        ],
        expectedStandard: "Types of computer operating configurations are classified according to processing demands."
      },
      {
        title: "11.4.2 Monitoring, Control, Automation, and Robotics",
        competencies: [
          "Describe monitoring and control systems",
          "Describe automation and robotics applications"
        ],
        knowledge: "Monitoring systems observe variables (e.g. patient heart rate) without altering them. Control systems monitor sensors and actively adjust actuators to maintain a target state (e.g. central heating). Automation and robotics applications use computers to automate physical tasks in manufacture, assembly, and dangerous environments.",
        skills: "Distinguishing monitoring vs. control loops, robotic path planning, sensor mapping",
        values: "Understanding automation, inquisitiveness in robotics, concern for labor shifts",
        learningActivities: [
          "Discussing how automated factories use robotic arms to assemble cars",
          "Drawing a block diagram of a sensor-actuator feedback control loop in a greenhouse water sprinkler system"
        ],
        expectedStandard: "Feedback loops in control systems and robotic automation processes are correctly analyzed."
      },
      {
        title: "11.4.3 Expert Systems and Artificial Intelligence",
        competencies: [
          "Describe expert systems and artificial intelligence",
          "Describe problems in the management of computer systems"
        ],
        knowledge: "Expert systems simulate the decision-making of a human expert (contain a knowledge base, inference engine, and user interface). Artificial Intelligence (AI) mimics cognitive functions. Management challenges include software bugs, systems obsolescence, and operational failures.",
        skills: "Expert system parsing, risk evaluation, system diagnostic tracking",
        values: "Curiosity in expert systems, appreciation of AI capabilities",
        learningActivities: [
          "Analyzing how a medical expert system diagnoses diseases based on a list of input symptoms",
          "Discussing the social impact of automation, such as job displacement and the creation of technical support professions"
        ],
        expectedStandard: "The structure of expert systems and challenges in managing modern IT installations are examined."
      }
    ]
  },
  {
    title: "11.5 Databases",
    generalCompetency: "Build database tables, declare primary keys, formulate relationships, design custom forms, and run queries and reports.",
    subtopics: [
      {
        title: "11.5.1 Database Design and Table Structure",
        competencies: [
          "Build a database, create tables, and declare primary keys",
          "Describe and implement database relationships"
        ],
        knowledge: "A database organizes data into tables consisting of fields (columns) and records (rows). Data types: text, number, date, currency, auto-number. A Primary Key is a unique identifier for each record. Relationships (e.g. one-to-many) connect tables together using foreign keys, maintained through referential integrity.",
        skills: "Database schema design, table construction, primary key selection, database relationship mapping",
        values: "Inquisitiveness in data modeling, accuracy, structural discipline",
        learningActivities: [
          "Designing a database schema for a school library with a 'Students' table and a 'Books' table",
          "Creating tables, setting data types, and linking them via a one-to-many relationship using a Form Wizard or relationship window"
        ],
        expectedStandard: "A multi-table database with primary keys and active relationships is successfully created."
      },
      {
        title: "11.5.2 Database Manipulation, Queries, and Forms",
        competencies: [
          "Illustrate data entry, editing, and redesigning a database form",
          "Search for records, sort, filter, and run queries and reports"
        ],
        knowledge: "Forms provide user-friendly layouts for data entry and editing. Queries extract specific records based on criteria (e.g. Mark > 50). Reports organize query outputs into printable formats. Database security involves setting password access, user privileges, and backups.",
        skills: "Database form styling, writing query criteria, generating reports",
        values: "Curiosity in data search, security consciousness",
        learningActivities: [
          "Designing a custom student data entry form in Design View",
          "Formulating and running a query to list all students who scored above 75 marks, sorting the results alphabetically, and generating a printable report"
        ],
        expectedStandard: "Practical queries, sorted database sheets, and formatted report layouts are successfully produced."
      }
    ]
  },
  {
    title: "11.6 Social and Economic Impact of Computers",
    generalCompetency: "Analyse social and economic effects of computer usage, examine data privacy standards, and evaluate security threats and combat measures.",
    subtopics: [
      {
        title: "11.6.1 Social, Economic, and Health Effects",
        competencies: [
          "Demonstrate an understanding of some social and economic effects of computer use on people and organisations",
          "Identify health and cultural implications of computer usage"
        ],
        knowledge: "Social and economic effects: job losses (automation) and gains (technical roles), increased productivity, digital divide, electronic emissions, and waste pollution. Health issues: Repetitive Strain Injury (RSI), eyestrain, backache. Cultural implications cover changing communications, digital lifestyles, and virtual interactions.",
        skills: "Social impact critique, ergonomic planning, emissions evaluation",
        values: "Health consciousness, environmental responsibility, appreciation of work balance",
        learningActivities: [
          "Discussing ergonomic solutions to prevent RSI and backache in computer laboratories",
          "Debating the environmental impact of electronic waste (e-waste) and safe disposal methods"
        ],
        expectedStandard: "Ergonomic risks, health solutions, and socio-economic effects of automation are correctly evaluated."
      },
      {
        title: "11.6.2 Data Privacy, Protection, and Security Threats",
        competencies: [
          "Describe measures to maintain integrity of data and privacy",
          "Identify features expected in data protection legislation",
          "Demonstrate an understanding of threats to security and measures to combat them"
        ],
        knowledge: "Data integrity is maintained by user access control, encryption, validation checks, and data protection legislation. Threats include hacking, data interception, and phishing. Countermeasures: firewalls, strong passwords, biometric authentication, secure sockets, and security audits.",
        skills: "Risk assessment, security measures implementation, data protection planning",
        values: "Security consciousness, respect for privacy, legal compliance",
        learningActivities: [
          "Researching core requirements of standard Data Protection Laws (data must be kept secure, accurate, and up-to-date)",
          "Formulating security strategies to protect an office network from hacking and malware threats"
        ],
        expectedStandard: "Data privacy requirements and systemic threats are analyzed alongside effective technical countermeasures."
      }
    ]
  },
  {
    title: "11.7 Specific Computer Applications",
    generalCompetency: "Examine how computers are utilized across diverse professional sectors such as education, medicine, agriculture, banking, retailing, transport, and office administration.",
    subtopics: [
      {
        title: "11.7.1 Sector-Specific Applications",
        competencies: [
          "Describe the use of computers in education, health, agriculture, and library systems",
          "Describe the use of computers in banking, retailing, industry, and transport"
        ],
        knowledge: "Sector applications: Education (e-learning, e-books, online administration); Health (medical expert systems, tele-medicine, diagnosis, electronic health records); Agriculture (soil analyzers, automated tractors, yield logging); Library systems (searching catalog databases, checkout barcoding); Banking (EFT, ATMs, credit cards, online banking); Retailing (EPOS point of sale, stock management); Transport (traffic control, navigation systems, logistics tracking).",
        skills: "Professional sector matching, library search automation, transaction tracking",
        values: "Appreciation of sectoral technologies, career awareness, efficiency focus",
        learningActivities: [
          "Creating a table showing how computers serve specific operational roles across different professions",
          "Simulating a library system checkout process or evaluating how ATMs use secure networks for bank transactions"
        ],
        expectedStandard: "Computer systems utilized in specialized professional disciplines are cleanly detailed and justified."
      },
      {
        title: "11.7.2 Office Automation and Data Processing",
        competencies: [
          "Identify office automation systems",
          "Define commercial and general data processing"
        ],
        knowledge: "Office automation covers using software to process files, manage schedules, and share records (word processors, email, calendar scheduling). Commercial and general data processing utilizes automated systems to handle large volumes of records (e.g. payroll, bank clearances, utility billing).",
        skills: "Office workflow mapping, commercial data batching, document scheduling",
        values: "Office efficiency, productivity, data accuracy",
        learningActivities: [
          "Mapping the flow of electronic documents in an automated modern business office",
          "Discussing why commercial data processing typically requires batch processing configurations"
        ],
        expectedStandard: "Office automation and standard commercial processing operations are defined."
      }
    ]
  }
];

export const obcComputerStudiesGrade12: Topic[] = [
  {
    title: "12.1 System Development",
    generalCompetency: "Understand and execute the stages of the System Life Cycle, justify fact-finding methods, construct Gantt charts and DFDs, plan testing, and select changeover methods.",
    subtopics: [
      {
        title: "12.1.1 The System Life Cycle and Fact-Finding",
        competencies: [
          "State the stages of the system life cycle in a logical order",
          "Justify the choice of suitable methods for fact-finding and describe feasibility studies"
        ],
        knowledge: "The System Life Cycle (SLC) comprises: 1. Fact-finding (interviews, questionnaires, observation, document review), 2. Feasibility study (technical, economic, and operational assessment), 3. System Analysis, 4. System Design, 5. Building and Testing, 6. Documentation, 7. Implementation (changeover), 8. Evaluation, and 9. Maintenance.",
        skills: "Fact-finding execution, feasibility analysis, chronological stage planning",
        values: "Teamwork in development, systematic analysis, skilfulness in planning",
        learningActivities: [
          "Drafting an interview guide or questionnaire to research problems in an existing manual school tuck-shop system",
          "Conducting a feasibility assessment (costs, hardware availability) for automating tuck-shop records"
        ],
        expectedStandard: "The logical stages of system development and feasibility processes are fully outlined."
      },
      {
        title: "12.1.2 Analysis and Design Tools",
        competencies: [
          "Describe analysis and use dataflow diagrams and system flowcharts as tools",
          "Produce a project plan using a Gantt chart",
          "Explain top-down design and use structure diagrams as tools"
        ],
        knowledge: "System Analysis models the existing system. Tools: Dataflow Diagrams (DFDs - showing data paths) and System Flowcharts (showing hardware-level processing). Project planning uses Gantt charts to track task timelines. System Design uses top-down design (breaking a system into smaller sub-modules) represented by Structure Diagrams.",
        skills: "DFD sketching, flowchart drawing, Gantt chart scheduling, top-down structure design",
        values: "Logical thinking in layout designs, accuracy in flowchart symbols, visual precision",
        learningActivities: [
          "Drawing a level-0 DFD representing the flow of order data in a tuck-shop system",
          "Designing a Gantt chart detailing a 10-week schedule for a software project"
        ],
        expectedStandard: "Dataflow diagrams, system flowcharts, and project timelines are successfully drawn and mapped."
      },
      {
        title: "12.1.3 Testing, Documentation, Changeover, and Maintenance",
        competencies: [
          "Describe testing strategies and choose suitable test data",
          "State items included in technical and user documentation",
          "Justify the choice of a method of changeover",
          "Describe how a system should be evaluated and maintained"
        ],
        knowledge: "Testing strategies use normal (acceptable), abnormal (invalid), and boundary (extreme) data. Documentation: Technical (source code, schemas, system requirements for developers) and User (installation guides, user instructions, troubleshooting). Changeover methods: Direct (immediate swap), Parallel (running both simultaneously), Pilot (testing in one branch), Phased (introducing modules gradually).",
        skills: "Selecting test data, drafting user guides, evaluating changeover risks, scheduling system maintenance",
        values: "Attention to detail in documentation, safety and risk awareness",
        learningActivities: [
          "Creating a table of test data (normal, abnormal, boundary) to test an age input field (range 10 to 18)",
          "Drafting a simple user manual page illustrating how to run search queries in a library system"
        ],
        expectedStandard: "Testing protocols, user manuals, and risk-managed implementation strategies are fully formulated."
      }
    ]
  },
  {
    title: "12.2 Algorithms and Programming",
    generalCompetency: "Formulate overall plans to solve programming problems, design algorithms using flowcharts and pseudocode, and test programmatic solutions.",
    subtopics: [
      {
        title: "12.2.1 Algorithm Planning and Design",
        competencies: [
          "Describe the stages in making an overall plan to solve a problem",
          "Explain algorithms and their relationship to a larger system",
          "Describe and use tools to design programs and algorithms",
          "Design, interpret, and test algorithms"
        ],
        knowledge: "An overall program plan identifies input requirements, logical processes, and desired outputs. Program design tools include pseudocode and program flowcharts (using input/output, process, decision, start/stop symbols). Algorithms form modules within larger system architectures.",
        skills: "Program planning, flowchart logic mapping, logical program structuring, debugging",
        values: "Inquisitiveness in algorithm design, modular discipline, logical rigor",
        learningActivities: [
          "Drafting an overall program flowchart to find the highest number in a given list",
          "Writing the corresponding algorithm in pseudo-code and dry-running it to verify the logic"
        ],
        expectedStandard: "Detailed program flowcharts and pseudocodes are designed, interpreted, and verified."
      }
    ]
  },
  {
    title: "12.3 Structured Query Language (SQL)",
    generalCompetency: "Understand SQL databases, write and execute SQL DML statements, generate queries and joins, and filter records across multiple tables.",
    subtopics: [
      {
        title: "12.3.1 Introduction to SQL and Data Definition",
        competencies: [
          "State elements of Structured Query Language (SQL)",
          "Understand how to create databases and tables in SQL structures"
        ],
        knowledge: "SQL is a standardized query language used to manage relational databases. Data Definition Language (DDL) statements are used to create, modify, and drop database schemas and table structures (e.g. CREATE TABLE Students (StudentID INT PRIMARY KEY, Name VARCHAR(50))).",
        skills: "Writing DDL statements, mapping table columns, schema design",
        values: "Database structure accuracy, systemic layout discipline",
        learningActivities: [
          "Writing a basic CREATE TABLE statement specifying a primary key and custom text data types",
          "Discussing the role of SQL as a database standard used across different programming environments"
        ],
        expectedStandard: "Valid SQL CREATE TABLE statements with primary keys are successfully written."
      },
      {
        title: "12.3.2 SQL Data Manipulation and Queries",
        competencies: [
          "Write and execute Data Manipulation Language (DML) statements",
          "Generate SQL queries to filter, sort, and search across multiple tables"
        ],
        knowledge: "Data Manipulation Language (DML) covers: INSERT (adding records), UPDATE (editing records), and DELETE (removing records). Querying uses SELECT statements with WHERE filters (e.g., SELECT * FROM Students WHERE Mark > 75). Joins query data across multiple connected tables (e.g., INNER JOIN).",
        skills: "DML coding (Insert, Update, Delete), selective querying, writing table joins, data sorting",
        values: "Productivity, accuracy, appreciation of database queries and SQL power",
        learningActivities: [
          "Writing SQL statements to INSERT a new record, UPDATE a student's address, and DELETE an old record",
          "Formulating SELECT queries using criteria, sorting results using ORDER BY, and writing a basic INNER JOIN statement to display books checked out by students"
        ],
        expectedStandard: "Practical SQL SELECT, INSERT, UPDATE, and multi-table JOIN queries are accurately executed."
      }
    ]
  },
  {
    title: "12.4 Computer Project",
    generalCompetency: "Plan, design, implement, test, and document a database/system development project, and comprehensively write a technical report.",
    subtopics: [
      {
        title: "12.4.1 Project Planning, Analysis, and Design",
        competencies: [
          "Demonstrate skills in project planning, analysis of existing problems, and designing solutions",
          "Formulate project objectives and action plans"
        ],
        knowledge: "A Computer Project involves: 1. Analysis (describing the problem, setting objectives, evaluating the existing system), 2. Design (action plans, Gantt charts, systems flowcharts, database layouts, input/output structures, hardware and software choices).",
        skills: "Project lifecycle planning, problem formulation, system workflow design, tool selection",
        values: "Efficiency in system development, professional documentation values",
        learningActivities: [
          "Formulating a problem description and clear project objectives for an inventory management database",
          "Drawing the systems flowchart and designing the table schemas and relational links for the database"
        ],
        expectedStandard: "A complete analysis and design portfolio for a proposed database system is produced."
      },
      {
        title: "12.4.2 Implementation, Testing, and Documentation",
        competencies: [
          "Use simple programming to develop database systems and demonstrate system products",
          "Formulate complete test strategies and test results",
          "Comprehensively write a computer system Report (technical and user documentation, evaluation)"
        ],
        knowledge: "Project implementation involves creating the database, tables, forms, queries, and reports. Testing uses test strategies on normal, abnormal, and boundary data. System documentation compiles: Technical report (system structures, relationship layouts) and User guide (operation instructions). Evaluation critiques objectives met and developments.",
        skills: "Relational database implementation, custom test strategy modeling, document formatting, analytical evaluation",
        values: "Appreciation of system product, accuracy, diagnostic evaluation, productivity",
        learningActivities: [
          "Building the relational database system and executing the validation routines",
          "Testing the product, compiling the test outcomes, writing the user manual, and evaluating the final product against initial project objectives"
        ],
        expectedStandard: "A fully functional database system, accompanied by a comprehensive technical report and user guide, is successfully delivered."
      }
    ]
  },
  {
    title: "12.5 Types of Computer Systems",
    generalCompetency: "Analyze and explain the processing concepts and applications of diverse computer systems, including network, control, automated, and multimedia systems.",
    subtopics: [
      {
        title: "12.5.1 Processing Systems",
        competencies: [
          "Describe concepts of Batch processing systems and Interactive systems",
          "Describe and demonstrate Network systems, Control systems, and Automated systems"
        ],
        knowledge: "Different system architectures support specific processing tasks: Batch processing systems (unattended runs, e.g. billing), Interactive systems (direct user dialogue), Network systems (distributed computing), Control systems (continuous sensor monitoring), and Automated systems.",
        skills: "Architecture evaluation, sensor matching, performance analysis",
        values: "Appreciation of systems structures, awareness of automated systems",
        learningActivities: [
          "Comparing batch systems with interactive real-time systems by analyzing operational speeds and user interventions",
          "Investigating how automated transport systems or autopilot systems combine sensors, control systems, and actuators"
        ],
        expectedStandard: "Processing systems are correctly analyzed and mapped to practical configurations."
      },
      {
        title: "12.5.2 Multimedia Systems and Applications",
        competencies: [
          "Describe and demonstrate Multimedia systems and their applications"
        ],
        knowledge: "Multimedia systems integrate multiple media forms: text, graphics, audio, video, and interactive animations. Applications cover interactive education (e-learning), simulated training, interactive kiosks, digital marketing, and virtual entertainment.",
        skills: "Multimedia integration, asset compilation, content presentation",
        values: "Appreciation of interactive systems, innovative design, creativity",
        learningActivities: [
          "Structuring an interactive educational slide presentation integrating images, custom audio clips, and hyperlinked video links",
          "Analyzing how online simulators use multimedia elements to train professionals"
        ],
        expectedStandard: "The integration and utility of multimedia applications in training and communication are demonstrated."
      }
    ]
  }
];
