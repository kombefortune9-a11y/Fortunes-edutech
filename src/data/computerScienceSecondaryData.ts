import { Topic } from './syllabi';

export const computerScienceForm1: Topic[] = [
  {
    title: "1.1 Fundamentals of Computing",
    generalCompetency: "Demonstrate understanding of essential computer hardware, software components, operating system, file management, application software, and basic troubleshooting",
    subtopics: [
      {
        title: "1.1.1 Computer Basics",
        competencies: [
          "1.1.1.1 Demonstrate understanding of essential computer software and hardware"
        ],
        learningActivities: [
          "Discussing the history and evolution of computing devices from mechanical calculators to modern digital computers",
          "Classifying computers by size, processing capacity, and purpose (microcomputers, workstations, mainframes, supercomputers)",
          "Analyzing internal and external components of computer hardware (Input, Process, Output, Storage cycle)",
          "Classifying computer software into System Software (OS, utilities, device drivers) and Application Software",
          "Operating essential computer hardware and system software in a computer laboratory"
        ],
        expectedStandard: "Understanding of essential computer hardware and software components demonstrated correctly"
      },
      {
        title: "1.1.2 Operating System and File Management",
        competencies: [
          "1.1.2.1 Demonstrate proper management of operating system and files"
        ],
        learningActivities: [
          "Discussing the core functions of an operating system (processor management, memory management, file management, device management, user interface)",
          "Demonstrating proper handling, configuration, and navigation of desktop and mobile operating systems (Windows, Linux, Android)",
          "Installing and updating operating system security patches and service packs",
          "Applying file management operations: creating, copying, moving, renaming, compressing (zipping), and deleting files and directories",
          "Organizing files and folders hierarchically using standardized naming conventions and directory paths",
          "Utilizing advanced search functions, filters, and indexing to locate files and installed programs efficiently"
        ],
        expectedStandard: "Proper management of operating system and files demonstrated correctly"
      },
      {
        title: "1.1.3 Application Software",
        competencies: [
          "1.1.3.1 Operate Commonly used application software"
        ],
        learningActivities: [
          "Discussing application software categories and their specific productivity functions (word processors, media players, web browsers, graphics editors)",
          "Identifying commonly used application software packages (VLC Media Player, Google Chrome, Adobe Acrobat Reader, Office suites)",
          "Demonstrating the installation, customization, updating, and safe removal of application software"
        ],
        expectedStandard: "Commonly used application software appropriately operated"
      },
      {
        title: "1.1.4 Basic Troubleshooting",
        competencies: [
          "1.1.4.1 Diagnose and resolve common computer problems"
        ],
        learningActivities: [
          "Analyzing computer system error messages, POST beep codes, and OS event logs",
          "Isolating common hardware malfunctions (loose connections, power failures, peripheral detection errors) and software crashes",
          "Accessing built-in diagnostic help resources and manufacturer knowledge bases to resolve technical issues",
          "Resolving identified software conflicts, unresponsive applications, and driver issues",
          "Recovering lost, deleted, or corrupted data from damaged storage media using recovery utilities"
        ],
        expectedStandard: "Common computer problems effectively resolved"
      }
    ]
  },
  {
    title: "1.2 Productivity Tools: Word Processing",
    generalCompetency: "Create, format, and structure professional documents using word processing software",
    subtopics: [
      {
        title: "1.2.1 Word Processing",
        competencies: [
          "1.2.1.1 Create Documents using Word Processing Software"
        ],
        learningActivities: [
          "Exploring the word processing user interface (ribbon, toolbars, ruler, status bar, document views)",
          "Describing basic functions, keyboard shortcuts, and document creation workflows",
          "Demonstrating touch typing skills, text navigation, and ergonomic workstation posture",
          "Creating and formatting documents applying font styling, paragraph alignment, line spacing, margins, indents, and bulleted/numbered lists",
          "Inserting and manipulating visual elements including tables, high-resolution images, shapes, SmartArt, and embedded charts",
          "Applying standard document templates to design professional CVs, letters, newsletters, and reports",
          "Utilizing proofreading tools (spell check, grammar check, word count, thesaurus, track changes)",
          "Importing and exporting documents in multiple file formats (DOCX, PDF, RTF, TXT, HTML)"
        ],
        expectedStandard: "Documents successfully created using word processing software"
      }
    ]
  },
  {
    title: "1.3 Data Representation",
    generalCompetency: "Apply number systems (Binary and Decimal) in computing and understand binary data encoding",
    subtopics: [
      {
        title: "1.3.1 Number Systems",
        competencies: [
          "1.3.1.1 Application of number systems in computing"
        ],
        learningActivities: [
          "Discussing the fundamental concepts of number systems (Base-10 Decimal, Base-2 Binary)",
          "Exploring the fundamental role of binary digits (bits and bytes) in digital logic, memory addressing, and computer architecture",
          "Converting numbers between decimal and binary representations (division-by-2 and positional place-value methods)",
          "Analyzing binary encoding schemes to understand how characters, numbers, and multimedia are represented in digital systems",
          "Demonstrating the use of binary numbers in basic programming calculations and hardware DIP switch configurations"
        ],
        expectedStandard: "Number Systems correctly applied in computing"
      }
    ]
  },
  {
    title: "1.4 Computer Networks",
    generalCompetency: "Configure and install basic Local Area Networks (LANs) and implement peripheral sharing",
    subtopics: [
      {
        title: "1.4.1 Network Design and Implementation",
        competencies: [
          "1.4.1.1 Configure and Install Networks"
        ],
        learningActivities: [
          "Discussing fundamental concepts and advantages of computer networking (resource sharing, centralized data, communication)",
          "Identifying basic networking hardware devices (Network Interface Cards - NICs, switches, routers, modems, wireless access points) and network software",
          "Discussing transmission media: guided/wired (Twisted pair, Coaxial, Fiber optic) and unguided/wireless (Wi-Fi, Bluetooth, Infrared)",
          "Configuring a Local Area Network (LAN) connecting computers using ethernet cables, switches, and broadband routers",
          "Implementing network sharing settings to share printers, drives, files, and folders securely across network nodes"
        ],
        expectedStandard: "Computer networks correctly configured and installed"
      }
    ]
  },
  {
    title: "1.5 Cybersecurity",
    generalCompetency: "Apply fundamental online safety, threat detection, and account security measures",
    subtopics: [
      {
        title: "1.5.1 Fundamentals of Cyber Security",
        competencies: [
          "1.5.1.1 Apply online safety and security measures"
        ],
        learningActivities: [
          "Discussing cybersecurity terminology, CIA triad (Confidentiality, Integrity, Availability), and threat vectors",
          "Identifying diverse cyber threats: malware (viruses, worms, trojans, ransomware, spyware), phishing, identity theft, and social engineering attacks",
          "Detecting potential cybersecurity threats using real-time antivirus monitoring tools, firewalls, and system security logs",
          "Describing the vital importance of cybersecurity in safeguarding personal, institutional, and national digital infrastructure",
          "Implementing robust password creation policies, password managers, and Multi-Factor Authentication (MFA / 2FA) to secure online accounts"
        ],
        expectedStandard: "Online Safety and Security measures successfully applied"
      }
    ]
  },
  {
    title: "1.6 Data Processing",
    generalCompetency: "Collect, clean, validate, and visualize data from multiple computing sources",
    subtopics: [
      {
        title: "1.6.1 Data Collection and Cleaning",
        competencies: [
          "1.6.1.1 Collect and clean data"
        ],
        learningActivities: [
          "Discussing key concepts of data processing cycles (data collection, preparation, input, processing, output, storage)",
          "Exploring data types in computing (numeric, string/text, boolean, date/time, categorical)",
          "Identifying data processing methods (batch processing, real-time processing, online processing)",
          "Utilizing digital tools for automated data capture (online forms, optical mark recognition, sensors, CSV imports)",
          "Collecting raw datasets from multiple primary and secondary sources",
          "Demonstrating data cleaning techniques: removing duplicates, handling missing values, standardizing text, and validating input ranges",
          "Designing interactive charts and visualizations to present processed data using tools like MS Power BI, Tableau, or Google Data Studio",
          "Developing testing protocols to verify data accuracy, consistency, and integrity"
        ],
        expectedStandard: "Data effectively collected, cleaned, and presented"
      }
    ]
  },
  {
    title: "1.7 Web Design",
    generalCompetency: "Design and structure responsive web pages using HTML5 semantic elements and web design tools",
    subtopics: [
      {
        title: "1.7.1 Fundamentals of Web Design",
        competencies: [
          "1.7.1.1 Design and Structure Web Pages using web design tools"
        ],
        learningActivities: [
          "Discussing key principles of web design: usability, visual hierarchy, responsive layout, accessibility, and navigation",
          "Identifying fundamental components of a website (URL, domain name, web server, web browser, web page)",
          "Describing the complementary roles of HTML (structure), CSS (styling), and JavaScript (interactivity)",
          "Designing and structuring web pages using standard HTML5 semantic elements (<header>, <nav>, <main>, <section>, <article>, <aside>, <footer>)",
          "Embedding multimedia (images, audio, video), creating hyperlinks, and developing HTML data tables and input forms"
        ],
        expectedStandard: "Simple web pages and structures successfully implemented"
      }
    ]
  },
  {
    title: "1.8 Digital Citizenship",
    generalCompetency: "Demonstrate ethical behavior, digital etiquette, intellectual property respect, and wellness in a digital environment",
    subtopics: [
      {
        title: "1.8.1 Digital Ethics",
        competencies: [
          "1.8.1.1 Demonstrate Ethical Behavior in a Digital Environment"
        ],
        learningActivities: [
          "Discussing the pillars of digital citizenship and responsible internet engagement (Netiquette)",
          "Demonstrating polite, respectful, and constructive communication in online forums, social media, and email",
          "Critically evaluating online digital content to distinguish verified facts from opinions, misinformation, fake news, and bias",
          "Developing strategies to balance screen time with physical and offline activities to maintain physical and mental well-being",
          "Promoting a culture of inclusion, empathy, fairness, and zero-tolerance for cyberbullying, trolling, and harassment in online communities",
          "Understanding intellectual property rights, copyright laws, Creative Commons licenses, and preventing software piracy and plagiarism"
        ],
        expectedStandard: "Ethical Behavior in Digital Environment Demonstrated Appropriately"
      }
    ]
  },
  {
    title: "1.9 Databases",
    generalCompetency: "Understand database fundamentals, relational concepts, and create structured tables using DBMS tools",
    subtopics: [
      {
        title: "1.9.1 Introduction to Databases",
        competencies: [
          "1.9.1.1 Create and manage databases"
        ],
        learningActivities: [
          "Defining a database and explaining the limitations of traditional flat-file systems versus Relational Database Management Systems (RDBMS)",
          "Discussing key database concepts: tables (entities), records (tuples/rows), fields (attributes/columns), and primary/foreign keys",
          "Differentiating types of database architectures (hierarchical, network, relational, NoSQL/document)",
          "Identifying popular DBMS software packages (Microsoft Access, MySQL, MariaDB, Oracle Database, PostgreSQL)",
          "Creating databases, designing tables, setting appropriate data types (Text, Number, Date/Time, Boolean), field properties, and validation rules using visual DBMS tools"
        ],
        expectedStandard: "Databases successfully created and managed"
      }
    ]
  },
  {
    title: "1.10 Artificial Intelligence",
    generalCompetency: "Understand fundamentals of Artificial Intelligence (AI), machine learning principles, and create simple AI models",
    subtopics: [
      {
        title: "1.10.1 Fundamentals of Artificial Intelligence (AI)",
        competencies: [
          "1.10.1.1 Design Artificial Intelligence (AI) Models"
        ],
        learningActivities: [
          "Defining Artificial Intelligence (AI) and exploring its historical milestones and modern applications",
          "Discussing core AI subfields: Machine Learning (Supervised, Unsupervised, Reinforcement), Deep Learning, Computer Vision, and Natural Language Processing (NLP)",
          "Identifying real-world problems suited for AI solutions (image classification, spam detection, recommendation systems, language translation)",
          "Collecting, labeling, and preprocessing training and testing datasets for machine learning models",
          "Using beginner-friendly visual machine learning platforms (e.g. Teachable Machine, Scratch AI extensions) to train and test simple AI classification models",
          "Evaluating societal, ethical, and bias considerations in AI system design"
        ],
        expectedStandard: "Artificial Intelligence (AI) Models designed"
      }
    ]
  },
  {
    title: "1.11 Internet of Things (IoT)",
    generalCompetency: "Understand fundamental concepts, hardware components, and everyday applications of the Internet of Things (IoT)",
    subtopics: [
      {
        title: "1.11.1 Basic Components of Internet of Things (IoT)",
        competencies: [
          "1.11.1.1 Demonstrate understanding of IoT components"
        ],
        learningActivities: [
          "Defining the Internet of Things (IoT) and explaining how smart physical objects collect and exchange data over networks",
          "Identifying key hardware components of IoT systems: input sensors (temperature, humidity, ultrasonic, motion PIR, light LDR), output actuators (motors, relays, buzzers, LEDs), microcontrollers (Arduino, ESP32, Raspberry Pi), and wireless communication modules",
          "Exploring everyday IoT applications in smart homes (automated lighting, smart thermostats), smart agriculture (soil moisture monitoring), healthcare, and transport"
        ],
        expectedStandard: "Understanding of IoT components demonstrated appropriately"
      }
    ]
  },
  {
    title: "1.12 Logic Gates",
    generalCompetency: "Understand fundamental logic gates, construct truth tables, and design simple digital control systems",
    subtopics: [
      {
        title: "1.12.1 Introduction to Logic Gates",
        competencies: [
          "1.12.1.1 Create Digital Control systems"
        ],
        learningActivities: [
          "Discussing the concept of logic gates as the basic building blocks of digital electronic integrated circuits",
          "Identifying standard logic gates, their circuit symbols, and Boolean expressions: AND, OR, NOT, NAND, NOR, XOR, XNOR",
          "Constructing and verifying Truth Tables for basic and combination logic gates",
          "Analyzing combinational logic circuits for various multi-input binary conditions",
          "Designing simple practical digital control systems (e.g. automated burglar alarm system, light-activated night switch, simple automated traffic light logic)"
        ],
        expectedStandard: "Digital control systems successfully created"
      }
    ]
  }
];

export const computerScienceForm2: Topic[] = [
  {
    title: "2.1 Productivity Tools: Spreadsheets",
    generalCompetency: "Use spreadsheet software for arithmetic calculations, advanced formulas, statistical analysis, charting, protection, and financial modeling",
    subtopics: [
      {
        title: "2.1.1 Spreadsheets",
        competencies: [
          "2.1.1.1 Use spreadsheet for data entry and analysis"
        ],
        learningActivities: [
          "Navigating the spreadsheet interface (rows, columns, cells, active cell, range, formula bar, worksheet tabs)",
          "Exploring commercial and personal uses of spreadsheets in accounting, inventory management, scientific data analysis, and budgeting",
          "Entering and formatting alphanumeric data, currency, dates, and percentages",
          "Performing mathematical operations using basic arithmetic formulas (+, -, *, /, ^) and relative/absolute cell referencing ($A$1)",
          "Utilizing built-in functions: Mathematical (SUM, PRODUCT), Statistical (AVERAGE, COUNT, COUNTA, COUNTIF, MAX, MIN, MEDIAN), Logical (IF, AND, OR), and Lookup (VLOOKUP, XLOOKUP)",
          "Filtering, sorting (multi-level), and conditional formatting to highlight data trends and anomalies",
          "Creating dynamic 2D and 3D visual charts (Column, Bar, Line, Pie, Scatter) with custom titles, legends, axis labels, and data callouts",
          "Implementing cell protection, worksheet locking, password encryption, and collaborative cloud sharing (Google Sheets, Excel Online)",
          "Recording and executing simple macros to automate repetitive spreadsheet tasks",
          "Developing basic financial models and what-if analysis scenarios (Goal Seek, Scenario Manager)"
        ],
        expectedStandard: "Entered and analyzed data correctly using spreadsheet"
      }
    ]
  },
  {
    title: "2.2 Data Representation",
    generalCompetency: "Apply number system operations (Octal, Hexadecimal) and character encoding (ASCII)",
    subtopics: [
      {
        title: "2.2.1 Number Systems",
        competencies: [
          "2.2.1.1 Apply Number System Operations"
        ],
        learningActivities: [
          "Discussing the concepts and mathematical bases of Octal (Base-8) and Hexadecimal (Base-16) number systems",
          "Converting numbers accurately between Decimal, Binary, Octal, and Hexadecimal representations",
          "Explaining why hexadecimal is used in computing (compact memory addresses, HTML color codes, MAC addresses)",
          "Converting alphanumeric text characters into ASCII (American Standard Code for Information Interchange) 7-bit/8-bit binary and hex codes",
          "Performing binary addition and subtraction (including 2's complement representation for negative integers)"
        ],
        expectedStandard: "Number System Operations applied accordingly"
      }
    ]
  },
  {
    title: "2.3 Introduction to Programming",
    generalCompetency: "Construct interactive algorithms and software programs using visual block-based programming platforms",
    subtopics: [
      {
        title: "2.3.1 Block-based Programming",
        competencies: [
          "2.3.1.1 Construct programs using block-based software"
        ],
        learningActivities: [
          "Exploring block-based programming environments (Scratch, Blockly, MakeCode)",
          "Describing the visual programming paradigm: drag-and-drop code blocks, sprites, stages, backdrops, and scripts",
          "Identifying fundamental programming constructs: sequential execution, conditional decision-making (if-then, if-then-else), iteration/loops (repeat, forever, repeat-until), variables, lists, and broadcast event triggers",
          "Constructing interactive multimedia stories, animated games, and simulations by sequencing functional code blocks",
          "Debugging and optimizing block-based scripts by tracing execution steps"
        ],
        expectedStandard: "Block-based programs constructed correctly"
      }
    ]
  },
  {
    title: "2.4 Networking",
    generalCompetency: "Develop, design, cable, and configure standard physical and logical network topologies",
    subtopics: [
      {
        title: "2.4.1 Network Topologies",
        competencies: [
          "2.4.1.1 Develop and Configure Network Topologies"
        ],
        learningActivities: [
          "Discussing characteristics, advantages, and disadvantages of physical network topologies (Bus, Star, Ring, Mesh, Tree, Hybrid)",
          "Analyzing the functional roles of network topology design in data transmission efficiency, fault tolerance, and cost",
          "Constructing and crimping network ethernet patch cables (UTP/STP Cat5e/Cat6) using RJ-45 connectors, crimping tools, and cable testers following T568A and T568B wiring standards",
          "Designing network topology diagrams using network simulation software (e.g. Cisco Packet Tracer)",
          "Building and configuring a physical Star topology connecting multiple client PCs to a centralized network switch and gateway router"
        ],
        expectedStandard: "Network topologies developed and configured correctly"
      }
    ]
  },
  {
    title: "2.5 Cybersecurity",
    generalCompetency: "Utilize cybersecurity defensive tools, analyze system vulnerabilities, and implement network security policies",
    subtopics: [
      {
        title: "2.5.1 Introduction to Cybersecurity",
        competencies: [
          "2.5.1.1 Utilize cybersecurity tools and technologies"
        ],
        learningActivities: [
          "Discussing cybersecurity principles and the critical need for defense-in-depth in modern digital systems",
          "Investigating security vulnerabilities across operating systems, unpatched application software, and open network ports",
          "Utilizing cybersecurity tools and utilities: configuring software firewalls, running vulnerability scans, updating antimalware definitions, and browser privacy extensions",
          "Formulating comprehensive organizational security policy guidelines (Acceptable Use Policy - AUP, data backup schedules, incident reporting)"
        ],
        expectedStandard: "Cybersecurity tools and technologies utilized accordingly"
      }
    ]
  },
  {
    title: "2.6 Algorithms",
    generalCompetency: "Design, trace, and refine algorithmic solutions using standard flowcharts and pseudocode",
    subtopics: [
      {
        title: "2.6.1 Fundamentals of Algorithms",
        competencies: [
          "2.6.1.1 Design Algorithms"
        ],
        learningActivities: [
          "Defining an algorithm and identifying core characteristics (finiteness, definiteness, input, output, effectiveness)",
          "Distinguishing between algorithm design techniques (divide-and-conquer, brute force, greedy approach)",
          "Constructing standard flowchart diagrams using conventional ANSI symbols (Terminal, Input/Output, Process, Decision, Connector, Flowline)",
          "Writing structured pseudocode utilizing standard control keywords (BEGIN, READ/INPUT, PRINT/OUTPUT, IF-THEN-ELSE, WHILE, FOR, END)",
          "Tracing algorithms with trace tables to dry-run logic and detect syntax and logical errors",
          "Refining and optimizing algorithms to minimize computational steps and handle edge cases"
        ],
        expectedStandard: "Algorithms designed correctly"
      }
    ]
  },
  {
    title: "2.7 Web Development",
    generalCompetency: "Apply Cascading Style Sheets (CSS) to format, style, and build responsive web pages",
    subtopics: [
      {
        title: "2.7.1 Cascading Style Sheets (CSS) Concepts",
        competencies: [
          "2.7.1.1 Apply CSS concepts to websites"
        ],
        learningActivities: [
          "Defining Cascading Style Sheets (CSS) and explaining its separation of presentation from HTML content",
          "Identifying the three methods of applying CSS: Inline styling, Internal/Embedded stylesheets, and External `.css` linked stylesheets",
          "Analyzing the syntax of CSS rules: selectors (element, class `.`, ID `#`, descendant, pseudo-classes), properties, and values",
          "Styling typography: `font-family`, `font-size`, `font-weight`, `color`, `text-align`, `line-height`",
          "Applying background styling: `background-color`, `background-image`, `background-size`, `background-repeat`",
          "Mastering the CSS Box Model: `content`, `padding`, `border`, and `margin`",
          "Designing responsive layouts using Flexbox, CSS Grid, and CSS `@media` screen queries for mobile, tablet, and desktop viewports"
        ],
        expectedStandard: "CSS concepts applied to websites correctly"
      }
    ]
  },
  {
    title: "2.8 Database",
    generalCompetency: "Design, construct, and query relational databases using Structured Query Language (SQL)",
    subtopics: [
      {
        title: "2.8.1 Database Design and Creation",
        competencies: [
          "2.8.1.1 Design and create databases using SQL"
        ],
        learningActivities: [
          "Discussing the fundamentals of Structured Query Language (SQL) and its sub-languages (DDL - Data Definition Language, DML - Data Manipulation Language, DQL - Data Query Language)",
          "Writing DDL SQL statements to create and alter databases and tables (`CREATE DATABASE`, `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`) with constraints (`PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `UNIQUE`)",
          "Writing DML SQL statements to manage data (`INSERT INTO`, `UPDATE`, `DELETE FROM`)",
          "Writing DQL SQL queries to retrieve specific records (`SELECT`, `FROM`, `WHERE`, `AND`, `OR`, `LIKE`, `IN`, `BETWEEN`)",
          "Executing multi-table relational queries using `INNER JOIN`, sorting with `ORDER BY`, and aggregating data with `GROUP BY` and `HAVING` (`SUM`, `AVG`, `COUNT`, `MAX`, `MIN`)"
        ],
        expectedStandard: "Databases designed and created using SQL correctly"
      }
    ]
  },
  {
    title: "2.9 Artificial Intelligence (AI)",
    generalCompetency: "Develop, train, evaluate, and explore applications of Artificial Intelligence models",
    subtopics: [
      {
        title: "2.9.1 AI Models",
        competencies: [
          "2.9.1.1 Develop AI Models"
        ],
        learningActivities: [
          "Exploring problem statements requiring predictive or classification AI capabilities",
          "Selecting suitable machine learning algorithm architectures (Decision Trees, K-Nearest Neighbors - KNN, Neural Networks)",
          "Designing, training, testing, and fine-tuning machine learning models using structured training data",
          "Evaluating model performance using accuracy metrics, confusion matrices, and validation datasets",
          "Exploring AI applications in gaming, computer graphics, pathfinding (A* search), procedural content generation, and chatbots"
        ],
        expectedStandard: "AI models developed successfully"
      }
    ]
  },
  {
    title: "2.10 Internet of Things",
    generalCompetency: "Develop prototype IoT models connecting microcontrollers, sensors, actuators, and wireless communication protocols",
    subtopics: [
      {
        title: "2.10.1 IoT Model Development",
        competencies: [
          "2.10.1.1 Develop an IoT Model"
        ],
        learningActivities: [
          "Exploring IoT prototyping development platforms (Arduino IDE, Raspberry Pi OS, MicroPython)",
          "Designing circuit schematic diagrams interfacing sensors (DHT11 temperature/humidity, LDR, ultrasonic HC-SR04) and actuators (servos, buzzers, relays, LCD displays) to microcontrollers",
          "Writing control scripts to read analog/digital sensor inputs and trigger automated actuator responses",
          "Configuring wireless IoT communication protocols: Wi-Fi (802.11), Bluetooth Low Energy (BLE), Zigbee, and LoRaWAN",
          "Building a fully functional basic IoT system (e.g. smart automatic plant watering system, motion-activated security alarm)"
        ],
        expectedStandard: "IoT Model developed accordingly"
      }
    ]
  },
  {
    title: "2.11 Robotics",
    generalCompetency: "Design, assemble, and program simple robotic systems incorporating mechanical and electronic components",
    subtopics: [
      {
        title: "2.11.1 Fundamentals of Robotics",
        competencies: [
          "2.11.1.1 Design Simple Robots"
        ],
        learningActivities: [
          "Discussing the fundamentals and laws of robotics (Isaac Asimov's Laws, modern robotics safety and ethics)",
          "Classifying robots by coordinate geometry, degree of freedom, mobility (wheeled, tracked, legged, robotic arms), and control autonomy (autonomous vs teleoperated)",
          "Identifying core robotic subsystem mechanisms: mechanical structure/chassis, DC gear motors/servos, electronic motor driver controllers (e.g. L298N), sensors, and power batteries",
          "Designing, assembling, and programming a mobile wheeled robot to perform autonomous line following, obstacle avoidance, or navigation tasks"
        ],
        expectedStandard: "Simple Robots correctly designed"
      }
    ]
  }
];

export const computerScienceForm3: Topic[] = [
  {
    title: "3.1 Productivity Tools: Presentation & Desktop Publishing",
    generalCompetency: "Design professional multimedia slide presentations and layout publications using desktop publishing tools",
    subtopics: [
      {
        title: "3.1.1 Presentation Software",
        competencies: [
          "3.1.1.1 Design and Create Presentations"
        ],
        learningActivities: [
          "Exploring advanced features of presentation software (MS PowerPoint, Google Slides, Keynote)",
          "Designing presentations using custom master slides, slide themes, consistent typography, and visual hierarchy",
          "Applying presentation design principles: contrast, alignment, 6x6 rule, whitespace balance",
          "Embedding hyperlinks, action buttons, audio clips, video files, and animated data charts",
          "Customizing slide transition effects and entrance/emphasis/exit animation timings",
          "Collaborating in real-time on cloud presentation platforms and managing version histories"
        ],
        expectedStandard: "Presentations designed and created correctly"
      },
      {
        title: "3.1.2 Desktop Publishing Software",
        competencies: [
          "3.1.2.1 Create and Format Publications"
        ],
        learningActivities: [
          "Exploring desktop publishing software (Microsoft Publisher, Adobe InDesign, Canva)",
          "Setting up custom page dimensions, margins, grid guides, and orientation for diverse print formats",
          "Working with linked text boxes, drop caps, font formatting, and text wrap around images",
          "Inserting, formatting, layering, and aligning high-resolution graphics, shapes, and borders",
          "Designing publications from scratch or templates: brochures, event flyers, business cards, school magazines, certificates",
          "Configuring Master Pages for consistent running headers, footers, and page numbering",
          "Preparing publications for professional commercial offset printing (CMYK, bleed, crop marks) and digital PDF distribution"
        ],
        expectedStandard: "Publications Created and Formatted correctly"
      }
    ]
  },
  {
    title: "3.2 Logic Gates",
    generalCompetency: "Design, simulate, and implement complex digital circuits, Boolean logic simplifications, and sequential timers",
    subtopics: [
      {
        title: "3.2.1 Application of Logic Gates",
        competencies: [
          "3.2.1.1 Design Digital Circuits"
        ],
        learningActivities: [
          "Simulating complex logic gate circuits using digital simulation tools (Logisim, CircuitVerse, Digital Works)",
          "Analyzing multi-input truth tables and deriving Boolean algebra expressions (Sum of Products)",
          "Simplifying Boolean expressions using Boolean laws and Karnaugh Maps (K-Maps)",
          "Designing combinational circuits: half-adders, full-adders, binary multiplexers (MUX), and decoders",
          "Designing sequential circuits: flip-flops (SR, D-type), binary counters, and digital clock timers for automated hardware control",
          "Integrating logic gate circuits into microcontroller-based automation projects"
        ],
        expectedStandard: "Digital circuits designed correctly"
      }
    ]
  },
  {
    title: "3.3 Networking",
    generalCompetency: "Utilize advanced internet protocols, online collaboration services, and cloud content sharing platforms",
    subtopics: [
      {
        title: "3.3.1 The Internet",
        competencies: [
          "3.3.1.1 Create and Share Content online"
        ],
        learningActivities: [
          "Exploring the architecture of the Global Internet (Client-Server model, ISP tiers, web servers, DNS root servers, backbone routing)",
          "Analyzing internet application protocols (HTTP, HTTPS, FTP, SMTP, POP3, IMAP, SSH)",
          "Setting up secure accounts across enterprise and educational platforms",
          "Configuring and conducting interactive video conferences and webinars (Zoom, Google Meet, Microsoft Teams)",
          "Creating, curating, and sharing digital multimedia content across cloud repositories and collaborative portals"
        ],
        expectedStandard: "Online content created and shared appropriately"
      }
    ]
  },
  {
    title: "3.4 Cybersecurity",
    generalCompetency: "Mitigate cyber threats, enforce data privacy laws, configure encryption, VPNs, and organizational security policies",
    subtopics: [
      {
        title: "3.4.1 Data Protection and Privacy",
        competencies: [
          "3.4.1.1 Mitigate and Respond to Cyber Threats"
        ],
        learningActivities: [
          "Discussing national and international data protection and privacy legislation (e.g. Zambia Data Protection Act, GDPR, CCPA)",
          "Analyzing digital footprints, cookies, telemetry tracking, and strategies for online identity protection",
          "Applying symmetric encryption (AES, DES) and asymmetric public-key cryptography (RSA, ECC, digital signatures, SSL/TLS certificates) to secure data in transit and at rest",
          "Configuring Virtual Private Networks (VPNs) to establish encrypted network tunnels over public internet",
          "Implementing multi-tiered security defense frameworks, intrusion detection systems (IDS), and organizational incident response plans"
        ],
        expectedStandard: "Cyber threats Mitigated and Responded to correctly"
      }
    ]
  },
  {
    title: "3.5 Programming",
    generalCompetency: "Master Python programming: syntax, data structures, modular functions, error handling, and build practical applications",
    subtopics: [
      {
        title: "3.5.1 Python Programming",
        competencies: [
          "3.5.1.1 Use Python to Code programs"
        ],
        learningActivities: [
          "Installing Python interpreter and configuring Integrated Development Environments - IDEs (VS Code, PyCharm, Thonny, Jupyter Notebook)",
          "Mastering Python basic syntax, variables, dynamic typing, comments, and standard I/O (`input()`, `print()`)",
          "Applying primitive data types (int, float, str, bool) and arithmetic/logical operators",
          "Structuring conditional branching (`if`, `elif`, `else`) and iterative loops (`for`, `while`, `break`, `continue`)"
        ],
        expectedStandard: "Python used to code programs correctly"
      },
      {
        title: "3.5.2 Coding in Python",
        competencies: [
          "3.5.2.1 Develop Practical Python Applications"
        ],
        learningActivities: [
          "Writing modular functions with parameters, default values, and `return` statements",
          "Manipulating complex data structures: Lists, Tuples, Dictionaries (key-value pairs), and Sets",
          "Implementing robust exception handling using `try`, `except`, `finally`, and custom error raising",
          "Performing file I/O operations (reading, writing, appending text and CSV files)",
          "Developing practical Python applications: automated administrative task scripts, console-based management systems, and graphical user interfaces (using Tkinter)"
        ],
        expectedStandard: "Practical Python Applications Developed accordingly"
      }
    ]
  },
  {
    title: "3.6 Web Development",
    generalCompetency: "Develop interactive, dynamic web applications using JavaScript, DOM manipulation, and Object-Oriented principles",
    subtopics: [
      {
        title: "3.6.1 Web Interactivity",
        competencies: [
          "3.6.1.1 Develop Dynamic Interactive Web Pages"
        ],
        learningActivities: [
          "Discussing the role of JavaScript as a client-side programming language in the modern web ecosystem",
          "Mastering JavaScript syntax: variables (`let`, `const`), data types, operators, and control structures",
          "Writing JavaScript functions, arrow functions, and event listeners (`addEventListener` for click, submit, keydown, change)",
          "Manipulating the Document Object Model (DOM): selecting elements (`querySelector`, `getElementById`), modifying innerHTML/textContent, altering CSS styles dynamically, creating and appending DOM nodes",
          "Applying Object-Oriented Programming (OOP) concepts in JavaScript (classes, objects, constructor methods, inheritance)",
          "Creating dynamic UI animations, interactive form validation, and dark mode toggles with JavaScript and CSS transitions"
        ],
        expectedStandard: "Dynamic Interactive Web Pages developed accordingly"
      }
    ]
  },
  {
    title: "3.7 Database",
    generalCompetency: "Manage, normalize, optimize, and connect relational databases to backend programming environments",
    subtopics: [
      {
        title: "3.7.1 Database Management",
        competencies: [
          "3.7.1.1 Manage Databases"
        ],
        learningActivities: [
          "Designing Entity-Relationship Diagrams (ERDs) showing entities, attributes, primary keys, foreign keys, and cardinalities (1:1, 1:N, M:N)",
          "Applying Database Normalization rules: First Normal Form (1NF - atomicity), Second Normal Form (2NF - remove partial dependency), and Third Normal Form (3NF - remove transitive dependency) to eliminate data redundancy",
          "Configuring user access roles, privilege grants (`GRANT`, `REVOKE`), and password permissions in MySQL/MariaDB",
          "Writing complex SQL scripts to perform database migrations, indexing for performance optimization, and data backup/restore dumps",
          "Connecting databases to backend programming languages (Python with `sqlite3` or `mysql-connector`, PHP, Java) to build database-driven applications"
        ],
        expectedStandard: "Database managed correctly"
      }
    ]
  },
  {
    title: "3.8 Artificial Intelligence",
    generalCompetency: "Train, evaluate, and deploy Artificial Intelligence models incorporating NLP, Computer Vision, and ethical considerations",
    subtopics: [
      {
        title: "3.8.1 AI Models",
        competencies: [
          "3.8.1.1 Deploy AI Models"
        ],
        learningActivities: [
          "Exploring foundational principles of Natural Language Processing (NLP: tokenization, sentiment analysis, named entity recognition) and Computer Vision (image segmentation, object detection)",
          "Preparing, augmenting, and splitting datasets into training, validation, and test subsets",
          "Training and evaluating machine learning classification and regression models",
          "Deploying trained AI models to local applications or web services using lightweight inference APIs",
          "Monitoring model performance, accuracy drift, and retraining models",
          "Analyzing advanced AI applications: AI in medical imaging diagnostics, autonomous navigation, and addressing ethical dilemmas (algorithmic bias, deepfakes, privacy concerns)"
        ],
        expectedStandard: "AI models deployed correctly"
      }
    ]
  },
  {
    title: "3.9 Internet of Things (IoT)",
    generalCompetency: "Create end-to-end IoT solutions with real-time cloud data visualization dashboards across key socio-economic sectors",
    subtopics: [
      {
        title: "3.9.1 Application of Internet of Things (IoT)",
        competencies: [
          "3.9.1.1 Create IoT solutions"
        ],
        learningActivities: [
          "Developing real-time cloud IoT dashboards (e.g. Blynk, ThingsBoard, ThingSpeak, Adafruit IO) to monitor live telemetry sensor streams",
          "Configuring lightweight IoT data transmission messaging protocols (MQTT, HTTP REST APIs, CoAP, WebSockets)",
          "Exploring and developing sector-specific IoT solutions: Smart Agriculture (soil moisture & automated irrigation), Smart Healthcare (vital sign telemetry), Smart Homes (energy management), and Smart Transportation (GPS fleet tracking)",
          "Presenting a completed functional IoT hardware-software prototype with stakeholder documentation"
        ],
        expectedStandard: "IoT solutions Created accordingly"
      }
    ]
  },
  {
    title: "3.10 Mobile Application",
    generalCompetency: "Design, build, test, and secure mobile applications for smart handheld devices",
    subtopics: [
      {
        title: "3.10.1 Introduction to Mobile Applications",
        competencies: [
          "3.10.1.1 Create Mobile Applications"
        ],
        learningActivities: [
          "Analyzing mobile computing ecosystems: Native apps (Android/Kotlin, iOS/Swift), Web apps (PWA), and Hybrid/Cross-platform apps (Flutter, React Native)",
          "Setting up mobile development environments and emulators (Android Studio, VS Code with Flutter)",
          "Designing user-centric mobile interfaces (UI/UX wireframes, touch gesture navigation, responsive screen density adaptations)",
          "Writing code to implement core mobile application logic, screens, and navigation stacks",
          "Analyzing mobile security risks (insecure data storage, unauthorized permissions, API vulnerabilities) and implementing local encryption and sandboxing",
          "Building and testing a complete functional mobile app"
        ],
        expectedStandard: "Mobile Applications Created Correctly"
      }
    ]
  },
  {
    title: "3.11 Cloud Computing",
    generalCompetency: "Develop, configure, and manage cloud computing service models (IaaS, PaaS, SaaS) and deployment infrastructures",
    subtopics: [
      {
        title: "3.11.1 Fundamentals of Cloud Computing",
        competencies: [
          "3.11.1.1 Develop and Manage cloud computing models"
        ],
        learningActivities: [
          "Defining the essential characteristics of cloud computing (on-demand self-service, broad network access, resource pooling, rapid elasticity, measured service)",
          "Differentiating cloud deployment models (Public, Private, Hybrid, Community) and service delivery tiers: Infrastructure as a Service (IaaS), Platform as a Service (PaaS), and Software as a Service (SaaS)",
          "Analyzing economic and operational benefits of cloud computing (CapEx vs OpEx, zero hardware maintenance, disaster recovery, global scalability)",
          "Managing cloud virtual machines, serverless computing, and managed databases on cloud platforms (AWS, Google Cloud Platform, Microsoft Azure)",
          "Implementing cloud object storage buckets, file synchronization, automated snapshots, and lifecycle backup policies"
        ],
        expectedStandard: "Cloud computing models correctly developed and managed"
      }
    ]
  },
  {
    title: "3.12 Robotics",
    generalCompetency: "Implement robotic control systems, integrate CAD design, PID algorithms, sensors, actuators, and IoT remote monitoring",
    subtopics: [
      {
        title: "3.12.1 Mechanical and Electronic Systems",
        competencies: [
          "3.12.1.1 Implement control systems"
        ],
        learningActivities: [
          "Designing 3D mechanical robotic chassis and manipulator arms using Computer-Aided Design (CAD) software",
          "Selecting, installing, and aligning servo motors, stepper motors, DC gearmotors, encoders, and transmission gear trains",
          "Assembling regulated power distribution systems and battery management circuits for robotics",
          "Testing and debugging electronic sensor conditioning and H-bridge motor driver circuits",
          "Implementing closed-loop feedback control systems (Proportional-Integral-Derivative - PID controllers) in Python/C++ to control robotic positioning and velocity",
          "Integrating robotic systems with IoT telemetry modules for wireless remote control, telemetry streaming, and diagnostics"
        ],
        expectedStandard: "Control systems implemented accordingly"
      }
    ]
  }
];

export const computerScienceForm4: Topic[] = [
  {
    title: "4.1 Computer Systems",
    generalCompetency: "Understand advanced computer architectures, real-time control systems, multi-user domains, and virtualization technologies",
    subtopics: [
      {
        title: "4.1.1 Fundamentals of Computer Systems",
        competencies: [
          "4.1.1.1 Demonstrate understanding of computer systems"
        ],
        learningActivities: [
          "Analyzing enterprise computer architectures (Von Neumann vs Harvard architectures, superscalar pipelining, multi-core processing, cache memory hierarchies)",
          "Evaluating specialized computer systems and their real-world applications: Expert Systems (inference engine, knowledge base), Batch Processing systems (payroll, billing), Real-Time Control systems (aircraft flight avionics, industrial robotics), and Satellite Navigation (GNSS/GPS trilateration)",
          "Configuring centralized multi-user network environments: Active Directory domains, user group access rights, and Group Policy Objects (GPOs)",
          "Installing and managing Hypervisor-based Virtual Machines (Type 1 bare-metal and Type 2 hosted like VirtualBox/VMware) to run concurrent operating systems on a single physical host"
        ],
        expectedStandard: "Understanding of computer systems demonstrated accordingly"
      }
    ]
  },
  {
    title: "4.2 Productivity Tools: Databases",
    generalCompetency: "Create, administer, and secure comprehensive database management systems (DBMS)",
    subtopics: [
      {
        title: "4.2.1 Database Management Systems",
        competencies: [
          "4.2.1.1 Create and Manage Databases"
        ],
        learningActivities: [
          "Discussing enterprise DBMS architectures, ACID transaction properties (Atomicity, Consistency, Isolation, Durability), and concurrency control",
          "Installing, configuring, and tuning database servers (MySQL, MariaDB, MS Access, PostgreSQL)",
          "Creating enterprise relational database schemas to manage complex real-world data (e-commerce inventory, hospital patient management, student academic records)",
          "Implementing advanced data queries, subqueries, views, stored procedures, and triggers",
          "Designing user-friendly data entry forms, switchboards, and multi-table parameterized financial/operational reports",
          "Enforcing database security: user privilege matrices, field-level encryption, audit logging, automated transactional backups, and point-in-time recovery"
        ],
        expectedStandard: "Databases created and managed accordingly"
      }
    ]
  },
  {
    title: "4.3 Computer Networking",
    generalCompetency: "Design, configure, subnet, and secure enterprise computer networks using OSI/TCP-IP models, VLANs, VPNs, and QoS",
    subtopics: [
      {
        title: "4.3.1 Network Design and Configurations",
        competencies: [
          "4.3.1.1 Design and Configure Computer Networks"
        ],
        learningActivities: [
          "Analyzing the OSI 7-Layer Model and TCP/IP 4-Layer Protocol Suite and mapping protocols to layers",
          "Explaining the addressing hierarchy: MAC addressing (Data Link), IP addressing IPv4 and IPv6 (Network), Port numbers (Transport), and DNS name resolution (Application)",
          "Designing and calculating IPv4 Subnetting schemes using Variable Length Subnet Masking (VLSM) to optimize IP address space allocation",
          "Configuring static and dynamic IP routing, DHCP server scopes, and DNS forward/reverse lookup zones",
          "Implementing Virtual Local Area Networks (VLANs) and 802.1Q trunking on managed switches to segment network broadcast domains",
          "Configuring Virtual Private Networks (VPNs - IPsec, OpenVPN) to provide encrypted remote access",
          "Configuring Quality of Service (QoS) traffic prioritization rules for latency-sensitive voice (VoIP) and streaming video",
          "Implementing enterprise wireless security protocols (WPA3-Enterprise, 802.1X network authentication) and conducting network diagnostics using ping, traceroute, and Wireshark packet captures"
        ],
        expectedStandard: "Computer Networks correctly designed and configured"
      }
    ]
  },
  {
    title: "4.4 Programming",
    generalCompetency: "Develop compiled, object-oriented software applications in C++ with memory management, classes, and error handling",
    subtopics: [
      {
        title: "4.4.1 Programming in C++",
        competencies: [
          "4.4.1.1 Develop C++ programs"
        ],
        learningActivities: [
          "Discussing the compilation model and features of C/C++ (preprocessor, compiler, linker, machine execution speed)",
          "Describing the standard structure of a C++ program: preprocessor directives (`#include <iostream>`), namespaces (`using namespace std;`), function prototypes, and `main()` function",
          "Mastering C++ syntax: variable declarations, standard data types, constants, arithmetic/relational/logical operators, and I/O streams (`cin`, `cout`, `cerr`)",
          "Constructing control flow logic using conditionals (`if-else`, `switch-case`) and loops (`for`, `while`, `do-while`)",
          "Manipulating single and multi-dimensional arrays, C-style strings, and standard library `std::string` objects",
          "Implementing Object-Oriented Programming (OOP) in C++: defining classes, instantiating objects, public/private access specifiers, constructor/destructor methods, and encapsulation",
          "Applying advanced OOP concepts: Inheritance, Polymorphism (method overriding and overloading), and Abstract classes",
          "Managing pointers, reference variables, dynamic memory allocation (`new`, `delete`), and file stream I/O (`ifstream`, `ofstream`)",
          "Debugging C++ programs using IDE debuggers to resolve syntax errors, logical defects, memory leaks, and runtime segmentation faults"
        ],
        expectedStandard: "C++ Programs developed accordingly"
      }
    ]
  },
  {
    title: "4.5 Mobile Application Development",
    generalCompetency: "Design, build, test, and deploy cross-platform mobile applications with UI/UX principles, APIs, and local storage",
    subtopics: [
      {
        title: "4.5.1 Mobile Application Design and Deployment",
        competencies: [
          "4.5.1.1 Develop mobile applications"
        ],
        learningActivities: [
          "Setting up mobile application development SDKs and cross-platform frameworks (Flutter/Dart, React Native/JavaScript, Kotlin)",
          "Differentiating User Interface (UI) design from User Experience (UX) design and building interactive wireframe prototypes",
          "Building adaptive, responsive UI layouts that scale seamlessly across varying smartphone and tablet screen dimensions and orientations",
          "Integrating hardware device features and sensors: GPS location services, camera capture, accelerometers, and push notifications",
          "Implementing local persistent caching and embedded databases (SQLite, Hive, Room) for offline-first capability",
          "Integrating external cloud REST APIs using asynchronous networking (HTTP GET, POST, PUT, DELETE with JSON parsing)",
          "Debugging, profiling performance, signing application binaries, and preparing release packages for app store publication"
        ],
        expectedStandard: "Mobile applications developed accordingly"
      }
    ]
  },
  {
    title: "4.6 Emerging Technologies",
    generalCompetency: "Demonstrate comprehensive understanding of emerging technologies (AR/VR, Blockchain, Quantum Computing, 3D Printing) and their societal impact",
    subtopics: [
      {
        title: "4.6.1 Fundamentals of Emerging Technologies",
        competencies: [
          "4.6.1.1 Demonstrate understanding of Emerging Technologies"
        ],
        learningActivities: [
          "Exploring revolutionary emerging technologies and analyzing their disruptive transformative impact on global industries and commerce",
          "Investigating Augmented Reality (AR) and Virtual Reality (VR): hardware headsets, spatial tracking, 3D rendering engines, and immersive simulations in surgery, pilot training, and education",
          "Understanding Blockchain technology: distributed ledgers, cryptographic hashing, consensus algorithms (Proof of Work/Stake), smart contracts, and decentralized finance",
          "Exploring Quantum Computing: qubits, superposition, quantum entanglement, and potential cryptographic breakthroughs",
          "Examining 3D Printing / Additive Manufacturing technologies, CAD stereolithography (STL) slicing, rapid prototyping, and custom bio-printing",
          "Discussing the socio-economic, environmental, labor market, and ethical implications of rapid technological acceleration"
        ],
        expectedStandard: "Understanding of Emerging Technologies demonstrated appropriately"
      }
    ]
  },
  {
    title: "4.7 Cloud Computing",
    generalCompetency: "Deploy cloud-native microservices platforms, manage serverless architectures, APIs, and cloud migration strategies",
    subtopics: [
      {
        title: "4.7.1 Cloud Deployment and Operations",
        competencies: [
          "4.7.1.1 Deploy Cloud Platforms"
        ],
        learningActivities: [
          "Deploying and orchestrating cloud-native services across enterprise cloud platforms (AWS, Google Cloud, Microsoft Azure, Firebase)",
          "Designing scalable cloud-native application architectures utilizing microservices, containers (Docker), and serverless cloud functions",
          "Building, documenting, securing, and consuming RESTful and GraphQL cloud APIs to interconnect disparate software systems",
          "Integrating cloud backend infrastructure with IoT gateway devices for real-time big data ingestion and stream analytics",
          "Designing and evaluating enterprise cloud migration strategies (Rehosting 'Lift & Shift', Refactoring, Rearchitecting), disaster recovery failover, and cloud cost governance"
        ],
        expectedStandard: "Cloud platforms deployed correctly"
      }
    ]
  }
];
