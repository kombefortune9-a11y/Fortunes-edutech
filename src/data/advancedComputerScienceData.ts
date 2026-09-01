import { Topic } from './syllabi';

export const advancedComputerScienceForm5: Topic[] = [
  {
    title: "5.1 Fundamentals of Computing",
    subtopics: [
      {
        title: "5.1.1 Computer Systems and Architecture",
        competencies: ["Discuss different computer system components.", "Distinguish between types of computer memory."],
        learningActivities: [
          "Discussing different computer system components.",
          "Distinguishing between types of computer memory."
        ],
        expectedStandard: "Computer system components clearly discussed. Types of computer memory accurately distinguished."
      }
    ]
  },
  {
    title: "5.2 Computational Thinking",
    subtopics: [
      {
        title: "5.2.1 Logical thinking, decomposition, and pattern recognition",
        competencies: ["Outline the concepts of logical thinking and pattern recognition", "Apply logical reasoning to solve problems.", "Decompose complex problems into smaller, manageable components.", "Compare pattern recognition methods across various scenarios"],
        learningActivities: [
          "Outlining the concepts of logical thinking and pattern recognition",
          "Applying logical reasoning to solve problems.",
          "Decomposing complex problems into smaller, manageable components",
          "Comparing pattern recognition methods across various scenarios (Classification, Clustering, Feature extraction, Template matching, and Anomaly detection)."
        ],
        expectedStandard: "Concepts of logical thinking and pattern recognition outlined correctly. Logical reasoning in problem solving applied correctly. Complex problems decomposed into smaller, manageable components correctly. Pattern recognition methods across various scenarios compared accurately."
      }
    ]
  },
  {
    title: "5.3 Algorithms",
    subtopics: [
      {
        title: "5.3.1 Introduction to algorithm complexity and Big O notation",
        competencies: ["Explain the basics of Big O and how it measures algorithm efficiency.", "Calculate the time and space complexity of simple algorithms.", "Analyse and compare algorithms based on their time and space complexity."],
        learningActivities: [
          "Explaining the basics of Big O and how it measures algorithm efficiency (Such as: O(1), O(log n), O(n), O(n log n), O(n²)).",
          "Calculating the time and space complexity of simple algorithms.",
          "Analysing and comparing algorithms based on their time and space complexity."
        ],
        expectedStandard: "The basics of Big O and how it measures algorithm efficiency correctly explained. Time and space complexity of simple algorithms calculated correctly. Algorithms based on their time and space complexity analysed effectively."
      }
    ]
  },
  {
    title: "5.4 Operating Systems",
    subtopics: [
      {
        title: "5.4.1 Introduction to Operating Systems",
        competencies: ["Examine different operating systems and explain their key functions", "Set up and configure Operating systems."],
        learningActivities: [
          "Examining different operating systems and explaining key functions",
          "Setting up and configuring Operating systems."
        ],
        expectedStandard: "Different operating systems examined and their key functions explained correctly. Operating systems Set up and configured appropriately."
      },
      {
        title: "5.4.2 Process Management",
        competencies: ["Explain factors that affect system performance.", "Examine different tools used to monitor and optimise system performance", "Use appropriate tools to monitor and optimise computer system performance", "Analyse and simulate process scheduling algorithms"],
        learningActivities: [
          "Explaining factors that affect system performance ( processor speed, memory size, Input/Output devices, software optimization ...)",
          "Examining different tools used to monitor and optimise system performance. (Disk Cleanup, Disk Defragmenter/Optimize Drives, Startup Manager …)",
          "Using appropriate tools to monitor and optimise computer system performance",
          "Analysing and simulating process scheduling algorithms (Such as: First-Come, First-Served (FCFS), Shortest Job Next (SJN), Round Robin (RR)) using any suitable method (online simulator, pen and paper, spreadsheet…)"
        ],
        expectedStandard: "Factors that affect system performance explained clearly. Different tools used to monitor and optimise system performance examined correctly. Appropriate tools used correctly to monitor and optimise computer system performance. Process scheduling algorithms clearly analysed and successfully simulated."
      },
      {
        title: "5.4.3 Memory Management",
        competencies: ["Discuss the purpose and benefits of Virtual machines.", "Describe different virtualisation software and their basic features.", "Configure and manage virtual machines with varying RAM allocations."],
        learningActivities: [
          "Discussing the purpose and benefits of Virtual machines.",
          "Describing different virtualisation software (Such as: Vmware workstation Player, Vm ware Fusion, Virtual Box ...) and their basic features.",
          "Configuring and managing virtual machines with varying RAM allocations."
        ],
        expectedStandard: "Purpose and benefits of virtual machines discussed clearly. Different virtualisation software and their basic features described clearly. Virtual machines with varying RAM allocations configured and managed successfully."
      },
      {
        title: "5.4.4 File Systems and Storage Management",
        competencies: ["Explain basic file and directory operations.", "Create and manage files and directories using a command-line or graphical interface.", "Configure and monitor various RAID levels for redundancy."],
        learningActivities: [
          "Explaining basic file and directory operations.",
          "Creating and managing files and directories using a command-line or graphical interface.",
          "Configuring and monitoring various RAID levels for redundancy."
        ],
        expectedStandard: "Basic file and directory operations explained correctly. Files and directories created and managed successfully. Various RAID levels for redundancy configured and monitored successfully."
      }
    ]
  },
  {
    title: "5.5 Python Programming",
    subtopics: [
      {
        title: "5.5.1 Object Oriented Programming (OOP)",
        competencies: ["Describe classes, objects, attributes, and methods in OOP.", "Explain the principles of inheritance, polymorphism, and encapsulation.", "Create classes and objects and design and implement Python applications using OOP principles.", "Evaluate the benefits of OOP in software development."],
        learningActivities: [
          "Describing classe, objects, attributes, and methods in OOP.",
          "Explaining the principles of inheritance, polymorphism, and encapsulation.",
          "Creating classes and objects and designing and implementing Python applications using OOP principles.",
          "Evaluating the benefits of OOP in software development"
        ],
        expectedStandard: "Classes, objects, attributes, and methods in OOP described correctly. Principles of inheritance, polymorphism, and encapsulation explained correctly. Classes and objects in Python applications using OOP principles created, designed, and implemented successfully. The benefits of OOP in software development evaluated correctly."
      },
      {
        title: "5.5.2 Data Structures",
        competencies: ["Discuss common data structures in Python.", "Select and apply appropriate data structures to solve real-world problems", "Design and implement efficient algorithms using appropriate data structures"],
        learningActivities: [
          "Discussing common data structures in Python (Such as: lists, tuples, dictionaries, sets …).",
          "Selecting and applying appropriate data structures to solve real-world problems",
          "Designing and implementing efficient algorithms using appropriate data structures."
        ],
        expectedStandard: "Common data structures in Python discussed correctly. Appropriate data structures selected and applied to solve real-world problems correctly. Efficient algorithms designed and implemented using appropriate data structures correctly."
      },
      {
        title: "5.5.3 Functional Programming",
        competencies: ["Discuss functional programming and its key concepts.", "Write, design and implement Python applications using functional programming principles."],
        learningActivities: [
          "Discussing functional programming and its key key concepts.",
          "Writing, designing and implementing Python applications using functional programming principles."
        ],
        expectedStandard: "Functional programming and its key concepts discussed accurately. Python applications using functional programming principles written, designed and implemented successfully."
      },
      {
        title: "5.5.4 Python Libraries",
        competencies: ["Identify popular Python libraries for various tasks", "Explain the functionality and usage of Python libraries.", "Solve complex problems using Python libraries.", "Develop custom Python libraries."],
        learningActivities: [
          "Identifying popular Python libraries for various tasks (Such as: NumPy, Pandas, Matplotlib …).",
          "Explaining the functionality and usage of Python libraries.",
          "Solving complex problems using Python libraries.",
          "Developing custom Python libraries."
        ],
        expectedStandard: "Popular Python libraries for various tasks identified correctly. Functionality and usage of Python libraries explained clearly. Complex problems solved accurately using Python libraries. Custom Python libraries developed accurately."
      },
      {
        title: "5.5.5 Web Development with Python",
        competencies: ["Identify Python web frameworks.", "Explain the architecture and components of web frameworks.", "Build web applications using Python frameworks."],
        learningActivities: [
          "Identifying Python web frameworks (Such as: Django, Flask …).",
          "Explaining the architecture and components of web frameworks.",
          "Building web applications using Python frameworks."
        ],
        expectedStandard: "Python web frameworks identified correctly. The architecture and components of web frameworks explained correctly. Web applications built skillfully using Python frameworks."
      },
      {
        title: "5.5.6 Data Science with Python",
        competencies: ["Identify popular Python libraries for data science.", "Explain the concepts of data cleaning, feature engineering, and machine learning.", "Perform data analysis and machine learning tasks using Python libraries.", "Evaluate the performance of machine learning models using metrics."],
        learningActivities: [
          "Identifying popular Python libraries for data science (Such as: NumPy, Pandas, Matplotlib, Scikit-learn …).",
          "Explaining the concepts of data cleaning, feature engineering, and machine learning.",
          "Performing data analysis and machine learning tasks using Python libraries.",
          "Evaluate the performance of machine learning models using metrics (Such as: accuracy, precision, recall …)."
        ],
        expectedStandard: "Popular Python libraries for data science identified correctly. The concepts of data cleaning, feature engineering, and machine learning explained correctly. Data analysis and machine learning tasks performed accurately. The performance of machine learning models evaluated correctly."
      },
      {
        title: "5.5.7 Automation and Scripting",
        competencies: ["Discuss common automation and scripting tasks.", "Automate tasks using Python scripts."],
        learningActivities: [
          "Discussing common automation and scripting tasks.",
          "Automating tasks using Python scripts (Such as: file handling, data processing, system tasks …)."
        ],
        expectedStandard: "Common automation and scripting tasks discussed correctly. Tasks using Python scripts automated successfully."
      }
    ]
  },
  {
    title: "5.6 Artificial Intelligence (AI)",
    subtopics: [
      {
        title: "5.6.1 AI Principles",
        competencies: ["Explain the relationship and differences between human intelligence and AI", "Identify examples of AI in everyday life.", "Propose a hypothetical AI application to solve real-world problems."],
        learningActivities: [
          "Explaining the relationship and differences between human intelligence and AI",
          "Identifying examples of AI in everyday life (finance, fraud detection, education, e-commerce, automotive, content creation, agriculture, marketing …).",
          "Proposing a hypothetical AI application to solve real-world problems."
        ],
        expectedStandard: "The relationship and differences between human intelligence and AI explained clearly. Examples of AI in everyday life identified correctly. A hypothetical AI application to solve real-world problems proposed accurately."
      },
      {
        title: "5.6.2 Types of Artificial Intelligence (AI)",
        competencies: ["Identify and explain the three main types of AI with examples.", "Evaluate the potential benefits and risks of each type of AI."],
        learningActivities: [
          "Identifying and explaining the three main types of AI (Narrow AI, General AI, Super AI) with examples.",
          "Evaluating the potential benefits and risks of each type of AI."
        ],
        expectedStandard: "The three main types of AI identified and explained correctly with examples. Potential benefits and risks of each type of AI evaluated correctly."
      },
      {
        title: "5.6.3 AI Programming",
        competencies: ["Write Python code to perform common AI tasks.", "Debug and troubleshoot errors in Python AI codes."],
        learningActivities: [
          "Writing Python code to perform common AI tasks (Such as: classification, regression, clustering …).",
          "Debugging and troubleshooting errors in Python AI codes."
        ],
        expectedStandard: "Python code to perform common AI tasks written correctly. Errors in Python AI code debugged and troubleshot efficiently."
      },
      {
        title: "5.6.4 AI libraries and frameworks.",
        competencies: ["Describe popular AI libraries and frameworks.", "Use AI libraries and frameworks to implement AI models."],
        learningActivities: [
          "Describing popular AI libraries and frameworks (Such as: TensorFlow, PyTorch, Keras …).",
          "Using AI libraries and frameworks to implement AI models."
        ],
        expectedStandard: "Popular AI libraries and frameworks described correctly. AI libraries and frameworks used correctly to implement AI models."
      },
      {
        title: "5.6.5 Data preprocessing and cleaning for AI.",
        competencies: ["Explain the importance of data preprocessing and cleaning for AI applications.", "Discuss common data preprocessing techniques.", "Clean and prepare real-world datasets for AI applications using Python libraries", "Evaluate the impact of data preprocessing on machine learning model performance."],
        learningActivities: [
          "Explaining the importance of data preprocessing and cleaning for AI applications.",
          "Discussing common data preprocessing techniques (such as: normalization, standardization, handling missing values …).",
          "Cleaning and preparing real-world datasets for AI applications using Python libraries.",
          "Evaluating the impact of data preprocessing on machine learning model performance."
        ],
        expectedStandard: "The importance of data preprocessing and cleaning for AI applications explained correctly. Common data preprocessing techniques discussed correctly. Real-world datasets for AI applications cleaned and prepared successfully. The impact of data preprocessing on machine learning model performance evaluated correctly."
      },
      {
        title: "5.6.6 Model Training and Evaluation.",
        competencies: ["Identify the steps involved in model training and evaluation.", "Explain the concepts of overfitting and underfitting.", "Interpret model performance metrics.", "Develop data preprocessing pipelines for AI projects"],
        learningActivities: [
          "Identifying the steps involved in model training and evaluation.",
          "Explaining the concepts of overfitting and underfitting.",
          "Interpreting model performance metrics.",
          "Developing data preprocessing pipelines for AI projects"
        ],
        expectedStandard: "The steps involved in model training and evaluation correctly identified. Concepts of overfitting and underfitting explained clearly. Model performance metrics interpreted correctly. Data preprocessing pipelines for AI projects developed correctly."
      },
      {
        title: "5.6.7 Deploying an Artificial Intelligence (AI) model",
        competencies: ["Identify the steps involved in deploying an AI model.", "Explain the challenges and considerations for deploying AI models.", "Evaluate the performance of deployed models using metrics.", "Develop deployment pipelines for AI applications."],
        learningActivities: [
          "Identifying the steps involved in deploying an AI model.",
          "Explaining the challenges and considerations for deploying AI models (such as: for deploying AI models …).",
          "Evaluating the performance of deployed models using metrics (such as: response time, accuracy, throughput…).",
          "Developing deployment pipelines for AI applications (such as: CI/CD for models, containerization, API deployment ...)"
        ],
        expectedStandard: "Steps involved in deploying an AI model identified correctly. Challenges and considerations for deploying AI models explained clearly. The performance of deployed models using metrics evaluated correctly. Deployment pipelines for AI applications developed successfully."
      },
      {
        title: "5.6.8 Machine Learning",
        competencies: ["Explain machine learning.", "Identify examples of machine learning in real-world applications.", "Differentiate the two main types of supervised learning.", "Evaluate the performance of different supervised learning algorithms.", "Discuss the two main types of unsupervised learning.", "Group data using clustering algorithms", "Design unsupervised learning models to address real-world problems."],
        learningActivities: [
          "Explaining machine learning.",
          "Identifying examples of machine learning in real-world applications.",
          "Differentiating the two main types of supervised learning (regression, classification)",
          "Evaluating the performance of different supervised learning algorithms.",
          "Discussing the two main types of unsupervised learning (clustering, dimensionality reduction).",
          "Grouping data using clustering algorithms",
          "Designing unsupervised learning models to address real-world problems."
        ],
        expectedStandard: "Machine learning explained correctly. Examples of machine learning in real-world applications identified clearly. The two main types of supervised learning differentiated correctly. Performance of different supervised learning algorithms evaluated correctly. The two main types of unsupervised learning discussed correctly. Data grouped correctly using clustering algorithms. Unsupervised learning models designed correctly."
      },
      {
        title: "5.6.9 Reinforcement Learning",
        competencies: ["Describe reinforcement learning.", "Explain the concepts of agents, environments, and rewards in reinforcement learning.", "Compare the performance of different reinforcement learning algorithms using libraries.", "Create reinforcement learning agents to solve real-world problems."],
        learningActivities: [
          "Describe reinforcement learning.",
          "Explaining the concepts of agents, environments, and rewards in reinforcement learning.",
          "Comparing the performance of different reinforcement learning algorithms using libraries (such as: Q-learning, DQN …).",
          "Creating reinforcement learning agents to solve real-world problems."
        ],
        expectedStandard: "Reinforcement learning described correctly. The concepts of agents, environments, and rewards in reinforcement learning explained clearly. The performance of different reinforcement learning algorithms compared correctly. Reinforcement learning agents created successfully."
      },
      {
        title: "5.6.10 Neural Networks",
        competencies: ["Describe how neural networks are inspired by the structure of the human brain.", "Discuss neural networks.", "Create simple neural networks using programming libraries.", "Explore the advantages and disadvantages of neural network in solving complex computational problems.", "Discuss real-world applications of neural networks."],
        learningActivities: [
          "Describe how neural networks are inspired by the structure of the human brain.",
          "Discussing neural networks (such as: feedforward, GNN, RNN, CNN, LSTM, GRU, transformer network, GAN …).",
          "Creating simple neural networks using programming libraries.",
          "Exploring the advantages and disadvantages of neural network in solving complex computational problems.",
          "Discussing real-world applications of neural networks."
        ],
        expectedStandard: "The inspiration of neural networks by the human brain described adequately. Neural networks discussed adequately. Simple neural networks created correctly. Advantages and disadvantages of neural networks in solving complex computational problems explored well. Real-world applications of neural networks discussed correctly."
      },
      {
        title: "5.6.11 Artificial neurons",
        competencies: ["Discuss artificial neurons.", "Describe how artificial neurons handle inputs and generate outputs.", "Calculate the output of an artificial neuron for given inputs and weights.", "Evaluate the limitations of artificial neurons."],
        learningActivities: [
          "Discussing artificial neurons (such as: perceptron, signoid, tanh …)",
          "Describing how artificial neurons handle inputs and generate outputs.",
          "Calculating the output of an artificial neuron for given inputs and weights.",
          "Evaluating the limitations of artificial neurons."
        ],
        expectedStandard: "Artificial neurons discussed correctly. Handling of inputs and generation of outputs by artificial neurons described well. The output of an artificial neuron calculated correctly. Limitations of artificial neurons evaluated correctly."
      }
    ]
  },
  {
    title: "5.7 Data Structures",
    subtopics: [
      {
        title: "5.7.1 Heaps",
        competencies: ["Compare and contrast various heap types.", "Explain algorithms for building and maintaining various types of heaps.", "Implement advanced heap structures and algorithms in real-world applications.", "Assess the efficiency and performance of various heap structures and algorithms in different contexts."],
        learningActivities: [
          "Comparing and contrasting various heap types (Such as: Binary Heap, Fibonacci Heap, Binomial Heap …).",
          "Explaining algorithms for building and maintaining various types of heaps.",
          "Implementing advanced heap structures and algorithms in real-world applications.",
          "Assessing the efficiency and performance of various heap structures and algorithms in different contexts."
        ],
        expectedStandard: "Various heap types compared and contrasted adequately. Algorithms for building and maintaining various types of heaps explained clearly. Advanced heap structures and algorithms in real-world applications implemented successfully. Efficiency and performance of various heap structures and algorithms in different contexts assessed successfully."
      },
      {
        title: "5.7.2 Hash Tables",
        competencies: ["Describe advanced hash table techniques and optimisations.", "Implement advanced hash tables and evaluate their performance in real-world scenarios."],
        learningActivities: [
          "Describing advanced hash table techniques and optimisations (Such as: Cuckoo Hashing, Dynamic resizing …)",
          "Implementing advanced hash tables and evaluating their performance in real-world scenarios."
        ],
        expectedStandard: "Advanced hash table techniques and optimizations described correctly. Advanced hash tables and their performance in real-world scenarios evaluated and implemented successfully."
      }
    ]
  },
  {
    title: "5.8 Database Management",
    subtopics: [
      {
        title: "5.8.1 Database Concepts",
        competencies: ["Describe a database and explain its purpose in data management.", "Identify and analyse real-world database applications.", "Compare and contrast different types of databases."],
        learningActivities: [
          "Describing a database and explaining its purpose in data management.",
          "Identifying and analysing real-world database applications.",
          "Comparing and contrasting different types of databases (Such as: relational, NoSQL …)."
        ],
        expectedStandard: "A database described correctly and its purpose in data management explained clearly. Real-world database applications identified and analysed correctly. Different types of databases compared and contrasted correctly."
      },
      {
        title: "5.8.2 Data Modeling and Normalization",
        competencies: ["Describe data modeling and the principles of normalisation.", "Create Entity-Relationship (ER) diagrams and design normalised databases for real-world applications.", "Evaluate the effectiveness of database normalization."],
        learningActivities: [
          "Describing data modeling and the principles of normalisation.",
          "Creating Entity-Relationship (ER) diagrams and designing normalised databases for real-world applications.",
          "Evaluating the effectiveness of database normalization (Use: 1NF (First normal form), 2NF (Second normal form), 3NF (Third normal form), BCNF (Boyce–Codd normal form), and 4NF (Fourth normal form))"
        ],
        expectedStandard: "Data modelling and the principles of normalisation described correctly. Entity–Relationship (ER) diagrams created successfully and normalised databases for real-world applications designed successfully. The effectiveness of database normalization evaluated correctly."
      },
      {
        title: "5.8.3 Structured Query Language (SQL) Basics",
        competencies: ["Explain basic SQL syntax and commands.", "Explain the purpose of SQL queries.", "Write simple SQL queries to retrieve, insert, update, and delete data."],
        learningActivities: [
          "Explaining basic SQL syntax and commands (Such as: SELECT, INSERT, UPDATE, DELETE …).",
          "Explaining the purpose of SQL queries.",
          "Writing simple SQL queries to retrieve, insert, update, and delete data."
        ],
        expectedStandard: "Basic SQL syntax and commands explained correctly. Purpose of SQL queries explained adequately. Simple SQL queries to retrieve, insert, update, and delete data written successfully."
      },
      {
        title: "5.8.4 Advanced SQL Concept",
        competencies: ["Identify and explain advanced SQL concepts.", "Write complex SQL queries using advanced concepts to retrieve and manipulate data.", "Evaluate the performance of SQL queries and apply optimisation techniques."],
        learningActivities: [
          "Identifying and explaining advanced SQL concepts.",
          "Writing complex SQL queries using advanced concepts to retrieve and manipulate data.",
          "Evaluating the performance of SQL queries and applying optimisation techniques."
        ],
        expectedStandard: "Advanced SQL concepts identified and explained correctly. Complex SQL queries using advanced concepts to retrieve and manipulate data written correctly. The performance of SQL queries evaluated correctly and optimisation techniques. Correctly applied."
      }
    ]
  },
  {
    title: "5.9 Web Technology",
    subtopics: [
      {
        title: "5.9.1 Advanced Hypertext Markup Language 5 (HTML5)",
        competencies: ["Identify and explain the purpose of new HTML5 elements, attributes and advanced features.", "Create complex web pages using advanced HTML5 elements and attributes.", "Evaluate the performance and accessibility of HTML5-based web pages.", "Develop and implement an interactive web application using HTML5 features."],
        learningActivities: [
          "Identifying and explaining the purpose of new HTML5 elements, attributes and advanced features.",
          "Creating complex web pages using advanced HTML5 elements and attributes.",
          "Evaluating the performance and accessibility of HTML5-based web pages.",
          "Developing and implementing an interactive web application using HTML5 features."
        ],
        expectedStandard: "New HTML5 elements, attributes and advanced features identified and explained correctly. Complex web pages using advanced HTML5 elements and attributes created correctly. Performance and accessibility of HTML5-based web pages evaluated correctly. Interactive web application using HTML5 features developed and implemented successfully."
      },
      {
        title: "5.9.2 Advanced Cascading Style Sheets (CSS)",
        competencies: ["Explain advanced CSS properties, techniques and layout principles.", "Develop and implement responsive web designs using CSS."],
        learningActivities: [
          "Explaining advanced CSS properties, techniques and layout principles.",
          "Developing and implementing responsive web designs using CSS."
        ],
        expectedStandard: "Advanced CSS properties, techniques and layout principles explained clearly. Responsive web designs using CSS developed and implemented successfully."
      },
      {
        title: "5.9.3 JavaScript Fundamentals",
        competencies: ["Identify JavaScript data types and operators.", "Explain the concepts of variables, functions and control flow.", "Write JavaScript code to perform basic calculations and manipulate Document Object Model (DOM) elements."],
        learningActivities: [
          "Identifying JavaScript data types and operators.",
          "Explaining the concepts of variables, functions and control flow.",
          "Writing JavaScript code to perform basic calculations and manipulate DOM elements."
        ],
        expectedStandard: "JavaScript data types and operators identified correctly. Concepts of variables, functions and control flow explained correctly. JavaScript code to perform basic calculations and DOM manipulation written correctly."
      },
      {
        title: "5.9.4 Advanced JavaScript",
        competencies: ["Identify errors and debug JavaScript code using browser developer tools.", "Build simple JavaScript applications."],
        learningActivities: [
          "Identifying errors and debugging JavaScript code using browser developer tools.",
          "Building simple JavaScript applications (Such as: calculators, form validation, to-do lists …)."
        ],
        expectedStandard: "Errors in JavaScript code identified and debugged correctly. Simple JavaScript applications built accurately."
      },
      {
        title: "5.9.5 Hypertext Preprocessor (PHP)Program",
        competencies: ["Explain PHP syntax and basic constructs.", "Describe the role of PHP in web development.", "Write PHP code to interact with databases and generate dynamic web content.", "Debug PHP code and build PHP-based web applications."],
        learningActivities: [
          "Explaining PHP syntax and basic constructs.",
          "Describing the role of PHP in web development.",
          "Writing PHP code to interact with databases and generate dynamic web content.",
          "Debugging PHP code and building PHP-based web applications."
        ],
        expectedStandard: "PHP syntax and basic constructs explained correctly. Role of PHP in web development described correctly. PHP code to interact with databases and generate dynamic web content written correctly. PHP code debugged successfully and PHP-based web applications built successfully."
      }
    ]
  },
  {
    title: "5.10 Data Science and Analytics",
    subtopics: [
      {
        title: "5.10.1 Data Collection",
        competencies: ["Design and implement a data collection plan for a real-world scenario.", "Evaluate and analyse collected data to assess its quality, reliability, and relevance"],
        learningActivities: [
          "Designing and implementing a data collection plan for a real-world scenario (Such as: surveys, sensors, web scraping, APIs).",
          "Evaluating and analysing collected data to assess its quality, reliability, and relevance."
        ],
        expectedStandard: "Data collection plans designed and implemented correctly. Collected data evaluated effectively."
      },
      {
        title: "5.10.2 Data Processing",
        competencies: ["Explain anomaly detection methods and common algorithms.", "Identify missing data, detect anomalies and correct data errors.", "Normalize, transform, and clean data for analysis."],
        learningActivities: [
          "Explaining anomaly detection methods and common algorithms.",
          "Identifying missing data, detecting anomalies and correcting data errors.",
          "Normalizing, transforming, and cleaning data for analysis."
        ],
        expectedStandard: "Anomaly detection methods and common algorithms explained clearly. Missing data identified, anomalies detected and data errors corrected successfully. Data normalised, transformed, and cleaned successfully."
      },
      {
        title: "5.10.3 Data Visualisation",
        competencies: ["Visualise data using plotting libraries.", "Design and create interactive data visualisations dashboard using various libraries."],
        learningActivities: [
          "Visualising data using plotting libraries (Such as: Plotly, Power BI, Tableau …).",
          "Designing and creating interactive data visualisations dashboard using various libraries (Such as: Dash, Streamlit, Tableau)."
        ],
        expectedStandard: "Data visualised effectively using plotting libraries effectively. Interactive data visualizations dashboard designed and created successfully."
      }
    ]
  },
  {
    title: "5.11 Cybersecurity",
    subtopics: [
      {
        title: "5.11.1 Cyber Threats",
        competencies: ["Describe cyber threats", "Explain the impact of cyber threats on individuals, organizations, and society.", "Recognize potential cyber threats in real-world scenarios.", "Evaluate the risks associated with different cyber threats.", "Explore hypothetical cyber-attack scenarios."],
        learningActivities: [
          "Describing Cyber threats",
          "Explaining the impact of cyber threats on individuals, organizations, and society.",
          "Recognizing potential cyber threats in real-world scenarios such as malware, phishing, DDoS attacks.",
          "Evaluating the risks associated with different cyber threats.",
          "Exploring hypothetical cyber-attack scenarios."
        ],
        expectedStandard: "Cyber threats described correctly. The impact of cyber threats on individuals, organizations, and society explained correctly. Potential cyber threats in real-world scenarios recognized effectively. The risks associated with different cyber threats evaluated correctly. Hypothetical cyber-attack scenarios explored extensively."
      },
      {
        title: "5.11.2 Cybersecurity Measures",
        competencies: ["Discuss common cybersecurity measures.", "Demonstrate the implementation of basic cybersecurity measures on a computer network.", "Evaluate the effectiveness of different cybersecurity measures in real-world scenarios."],
        learningActivities: [
          "Discussing common cybersecurity measures.",
          "Demonstrating the implementation of basic cybersecurity measures on a computer network.",
          "Evaluating the effectiveness of different cybersecurity measures in real-world scenarios."
        ],
        expectedStandard: "Common cybersecurity measures discussed adequately. The implementation of basic cybersecurity measures on a computer network demonstrated correctly. Effectiveness of different cybersecurity measures in real-world scenarios evaluated effectively."
      },
      {
        title: "5.11.3 Encryption Principles",
        competencies: ["Describe encryption and decryption.", "Explain different types of encryption algorithms.", "Use encryption tools to encrypt and decrypt data.", "Evaluate encryption algorithms and outline a strategy for a specific data set."],
        learningActivities: [
          "Describing encryption and decryption",
          "Explaining different types of encryption algorithms (Such as: Symmetric, asymmetric, hashing …).",
          "Using encryption tools to encrypt and decrypt data (Such as: VeraCrypt, GnuPG, OpenSSL …).",
          "Evaluating encryption algorithms and outlining a strategy for a specific data set."
        ],
        expectedStandard: "Encryption and decryption described correctly. Different types of encryption algorithms explained correctly. Encryption tools to encrypt and decrypt data used successfully. Encryption algorithms evaluated effectively and a strategy for a specific data set outlined correctly."
      },
      {
        title: "5.11.4 Cybersecurity fundamentals",
        competencies: ["Explain the CIA triad and security policies in information security.", "Analyse threat modeling and risk evaluation in identifying security risks.", "Identify malware types and common attack vectors in cybersecurity.", "Apply security controls and layered defense strategies in cybersecurity."],
        learningActivities: [
          "Explaining the CIA (Confidential, Integrity, Availability) triad and security policies in information security.",
          "Analysing threat modeling and risk evaluation in identifying security risks.",
          "Identifying malware types and common attack vectors in cybersecurity.",
          "Applying security controls and layered defense strategies in cybersecurity"
        ],
        expectedStandard: "CIA triad and security policies in information security explained correctly. Threat modeling and risk evaluation in identifying security risks analysed effectively. Malware types and common attack vectors in cybersecurity identified correctly. Security controls and layered defense strategies in cybersecurity applied effectively."
      }
    ]
  },
  {
    title: "5.12 Networking",
    subtopics: [
      {
        title: "5.12.1 Network Architecture",
        competencies: ["Describe key network architecture terms, concepts, and features.", "Compare and contrast various network architectures based on performance, security, and scalability.", "Design a network architecture for a specific organization ensuring scalability, security, and efficiency."],
        learningActivities: [
          "Describing key network architecture terms, concepts, and features (Such as: topology, LAN, WAN, client-server, peer-to-peer, cloud, hybrid).",
          "Comparing and contrasting various network architectures based on performance, security, and scalability.",
          "Designing a network architecture for a specific organization ensuring scalability, security, and efficiency."
        ],
        expectedStandard: "Key network architecture terms, concepts, and features described correctly. Various network architectures compared and contrasted effectively based on performance, security, and scalability. A scalable, secure, and efficient network architecture designed correctly."
      },
      {
        title: "5.12.2 OSI Model and Protocols",
        competencies: ["Explain the purpose and functions of the seven OSI layers, including the protocols at each layer.", "Compare and contrast the OSI model with the TCP/IP model.", "Evaluate the effectiveness of various OSI layer protocols for specific network tasks."],
        learningActivities: [
          "Explaining the purpose and functions of the seven OSI layer, including the protocols each layer of the OSI model.",
          "Comparing and contrasting the OSI model with the TCP/IP model.",
          "Evaluating the effectiveness of various OSI layer protocols for specific network tasks."
        ],
        expectedStandard: "The purpose and functions of the seven OSI layers, including the protocols at each layer, explained correctly. The OSI model and the TCP/IP model compared and contrasted correctly. The effectiveness of various OSI layer protocols for specific network tasks evaluated effectively."
      },
      {
        title: "5.12.3 IP addressing",
        competencies: ["Describe IP addressing concepts.", "Evaluate the pros and cons of static versus dynamic IP addressing across various network environments.", "Calculate subnet masks for a given IP address and determine the range of possible addresses within a subnet."],
        learningActivities: [
          "Describing IP addressing concepts (Such as: IPv4, IPv6, public vs private Ips …).",
          "Evaluating the pros and cons of static versus dynamic IP addressing across various network environments.",
          "Calculating Subnet masks for a given IP address and determining the range of possible addresses within a subnet."
        ],
        expectedStandard: "IP addressing concepts described correctly. Pros and cons of static versus dynamic IP addressing across various network environments evaluated effectively. Subnet masks for a given IP address calculated accurately."
      }
    ]
  },
  {
    title: "5.13 Human-Computer Interaction (Hci)",
    subtopics: [
      {
        title: "5.13.1 Principles of Human-Computer Interaction",
        competencies: ["Explain the evolution of Human-Computer Interaction.", "Describe the principles of Human-Computer Interaction through research and Presentations.", "Evaluate the application of Human-Computer Interaction principles in modern technologies.", "Explore how Human-Computer Interaction principles influence user interactions with different technologies."],
        learningActivities: [
          "Explaining the evolution of Human-Computer Interaction",
          "Describing the principles of Human-Computer Interaction through research and Presentations.",
          "Evaluating the application of Human-Computer Interaction principles in modern technologies.",
          "Exploring how Human-Computer Interaction principles influence user interactions with different technologies."
        ],
        expectedStandard: "The evolution of Human-Computer Interaction explained clearly. Principles of Human-Computer Interaction described correctly. Application of Human-Computer Interaction principles in modern technologies evaluated correctly. The influence of HCI principles on user interactions with different technologies explored effectively."
      }
    ]
  },
  {
    title: "5.14 Software Development",
    subtopics: [
      {
        title: "5.14.1 System Development Life Cycle (SDLC)",
        competencies: ["Discuss the System Development Life Cycle.", "Apply the stages of the System Development Life Cycle in case studies.", "Explore the various roles played by systems development professionals."],
        learningActivities: [
          "Discussing the System Development Life Cycle.",
          "Applying the stages of the System Development Life Cycle in case studies.",
          "Exploring the various roles played by systems development professionals."
        ],
        expectedStandard: "The System Development Life Cycle discussed clearly. The stages of the System Development Life Cycle applied appropriately in case studies. Various roles played by systems development professionals explored effectively."
      },
      {
        title: "5.14.2 System Development Life Cycle (SDLC) methodologies",
        competencies: ["Discuss the methodologies used in System Development Life Cycle.", "Assess the tools and techniques used in System Development Life Cycle methodologies.", "Implement the System Development Life Cycle methodologies."],
        learningActivities: [
          "Discussing the methodologies used in System Development Life Cycle.",
          "Assessing the tools and techniques used in System Development Life Cycle methodologies.",
          "Implementing the System Development Life Cycle methodologies."
        ],
        expectedStandard: "Methodologies used in System Development Life Cycle discussed adequately. Tools and techniques used in System Development Life Cycle methodologies assessed correctly. System Development Life Cycle methodologies implemented successfully."
      }
    ]
  },
  {
    title: "5.15 Mobile Applications",
    subtopics: [
      {
        title: "5.15.1 Components of Mobile Applications",
        competencies: ["Describe the key user interface elements of mobile applications.", "Design wireframes and mockups of mobile applications", "Design mobile application Components"],
        learningActivities: [
          "Describing the key user interface elements of mobile applications.",
          "Designing wireframes and mockups of mobile applications.",
          "Designing mobile application Components (such as: UI, UX, Networking …)"
        ],
        expectedStandard: "Key user interface elements described adequately. Wireframes and mockups designed successfully. Mobile application components designed accurately."
      },
      {
        title: "5.15.2 Mobile Application Development",
        competencies: ["Develop cross-platform mobile applications.", "Develop mobile applications that use device sensors.", "Deploy and publish mobile applications.", "Evaluate and maintain the published mobile applications."],
        learningActivities: [
          "Developing cross-platform mobile applications.",
          "Develop mobile applications that use device sensors (such as: camera, GPS, fingerprint …)",
          "Deploying and publishing mobile applications.",
          "Evaluating and maintaining the published mobile applications."
        ],
        expectedStandard: "Cross-platform mobile applications developed successfully. Mobile applications that use device sensors developed successfully. Mobile applications deployed and published successfully. Published mobile applications evaluated and maintained adequately."
      }
    ]
  },
  {
    title: "5.16 Block chain and Cryptography",
    subtopics: [
      {
        title: "5.16.1 Blockchain Technologies",
        competencies: ["Describe blockchain and its key features.", "Compare public and private blockchains.", "Explain blockchain technologies", "Analyse the security and scalability of blockchain technologies", "Evaluate blockchain technologies.", "Identify real-world applications of blockchain technologies.", "Develop simple blockchain platforms", "Design complex blockchain platforms for real-life applications"],
        learningActivities: [
          "Describing blockchain and its key features.",
          "Comparing public and private blockchains.",
          "Explaining blockchain technologies (such as: smart contracts, crypto wallets, blockchain platforms development tools, decentralised apps …).",
          "Analysing the security and scalability of blockchain technologies.",
          "Evaluating blockchain technologies.",
          "Identifying real-world applications of blockchain technologies.",
          "Developing simple blockchain platforms",
          "Design complex blockchain platforms for real-life applications"
        ],
        expectedStandard: "Blockchain and its key features described correctly. Public and private blockchains compared effectively. Blockchain technologies explained thoroughly. The security and scalability of blockchain technologies analysed adequately. Blockchain technologies evaluated effectively. Real-world applications of blockchain technologies identified correctly. Simple blockchain platforms developed correctly. Complex blockchain platforms for real-life applications designed correctly."
      },
      {
        title: "5.16.2 Cryptography in Blockchain",
        competencies: ["Describe the cryptographic algorithms used in blockchain systems.", "Explain the role of cryptography in securing blockchain technologies.", "Assess vulnerabilities in blockchain cryptographic systems."],
        learningActivities: [
          "Describing the cryptographic algorithms used in blockchain systems (such as: ECDSA, RSA …).",
          "Explaining the role of cryptography in securing blockchain technologies.",
          "Assessing vulnerabilities in blockchain cryptographic systems."
        ],
        expectedStandard: "Cryptographic algorithms used in blockchain systems described thoroughly. The role of cryptography in securing blockchain technologies explained correctly. Vulnerabilities in blockchain cryptographic systems assessed adequately."
      }
    ]
  },
  {
    title: "5.17 Internet Of Things (IoT)",
    subtopics: [
      {
        title: "5.17.1 Introduction to the Internet of Things (IoT)",
        competencies: ["Describe how the evolution of IoT has influenced modern smart systems.", "Explain the key components of IoT"],
        learningActivities: [
          "Describing how the evolution of IoT has influenced modern smart systems.",
          "Explaining the key components of IoT (such as: sensors, actuators, connectivity, cloud, data processing, user interface …)."
        ],
        expectedStandard: "The influence of the evolution of the IoT on modern smart systems described adequately. The key components of IoT explained correctly."
      },
      {
        title: "5.17.2 IoT Architecture and Ecosystem",
        competencies: ["Describe the layers of the IoT Architecture.", "Describe the IoT platforms and middleware.", "Discuss IoT protocols and standards"],
        learningActivities: [
          "Describing the layers of the IoT Architecture (Perception, Transport, Processing, Application, Business)",
          "Describing the IoT platforms and middleware.",
          "Discussing IoT Protocols and Standards (such as: MQTT, CoAP, HTTP …)"
        ],
        expectedStandard: "The layers of the IoT architecture described clearly. The IoT platforms and middleware described correctly. IoT Protocols and Standards discussed successfully."
      },
      {
        title: "5.17.3 IoT Devices and Hardware",
        competencies: ["Explain the types of IoT devices.", "Explain the IoT core hardware components."],
        learningActivities: [
          "Explaining the types of IoT devices (such as: Wearables, Smart Home Devices, Industrial Sensors …).",
          "Explaining the IoT core hardware components (Sensors, Actuators, Microcontrollers / Microprocessor, Communication Modules, Power sources…)"
        ],
        expectedStandard: "The types of IoT devices described successfully. The IoT core hardware components explained accurately."
      },
      {
        title: "5.17.4 IoT Device Networking",
        competencies: ["Establish communication between IoT devices.", "Design IoT prototypes."],
        learningActivities: [
          "Establishing communication between IoT devices.",
          "Designing IoT prototypes."
        ],
        expectedStandard: "Communication between IoT devices established successfully. IoT prototypes designed correctly."
      }
    ]
  },
  {
    title: "5.18 Basic Electronics",
    subtopics: [
      {
        title: "5.18.1 Data representation and number systems",
        competencies: ["Explain the fundamental concepts of different number systems.", "Convert numbers between various bases.", "Perform basic arithmetic operations.", "Describe the significance of different number systems in computing.", "Perform Two’s compliment arithmetic operations and explain its use in computer systems."],
        learningActivities: [
          "Explaining the fundamental concepts of different number systems (binary, octal, decimal and hexadecimal).",
          "Converting numbers between various bases.",
          "Performing basic arithmetic operations (addition, subtraction, multiplication, and division.",
          "Describing the significance of different number systems in computing.",
          "Performing Two’s compliment arithmetic operations and explaining its use in computer systems."
        ],
        expectedStandard: "Fundamental concepts of different number systems explained clearly. Various number bases converted correctly. Basic arithmetic operations performed accurately. The significance of different number systems in computing described correctly. Two’s complement arithmetic operations performed correctly, and its use in computer systems explained clearly."
      },
      {
        title: "5.18.2 Logic Gates",
        competencies: ["Discuss logic gates.", "Design and construct logic circuits using logic gates.", "Simulate logic circuits using simulation tools.", "Create logic circuits porotypes and test them on a breadboard."],
        learningActivities: [
          "Discussing logic gates (Such as: OR, AND, NOT, Buffer, NAND, NOR, XOR, XNOR).",
          "Designing and constructing logic circuits (Such as: adders, subtractors, …) using logic gates.",
          "Simulating logic circuits using simulation tools (Such as: Tinkercad, CircuitLab ...).",
          "Creating logic circuits prototypes and testing them on a breadboard."
        ],
        expectedStandard: "Logic gates discussed thoroughly. Logic circuits designed and constructed successfully. Logic circuits simulated correctly using simulation tools. Logic circuits prototypes created and tested accurately on a breadboard."
      }
    ]
  },
  {
    title: "5.19 Cloud Computing",
    subtopics: [
      {
        title: "5.19.1 Cloud Providers",
        competencies: ["Compare and analyse services of different major cloud providers", "Evaluate benefits and challenges of cloud providers and select appropriate ones based on specific needs"],
        learningActivities: [
          "Comparing and analysing services of different major cloud providers",
          "Evaluating benefits and challenges of cloud providers and select appropriate ones based on specific needs"
        ],
        expectedStandard: "Services of different major cloud providers compared and analysed effectively. Benefits and challenges of cloud providers evaluated effectively, and appropriate providers selected based on specific needs."
      },
      {
        title: "5.19.2 Cloud Accounts",
        competencies: ["Set up cloud accounts", "Use cloud-based applications for common productivity tasks."],
        learningActivities: [
          "Setting up cloud accounts.",
          "Using cloud-based applications (Such as: Google Drive, Office 365, Dropbox …) for common productivity tasks."
        ],
        expectedStandard: "Cloud accounts set up successfully. Cloud-based applications used successfully."
      },
      {
        title: "5.19.3 Collaboration Tools",
        competencies: ["Operate cloud-based collaboration tools.", "Assess the impact of cloud applications and collaboration tools on productivity, security and cost."],
        learningActivities: [
          "Operating cloud-based collaboration tools (Such as: Slack, Teams, Zoom, SharePoint …).",
          "Assessing the impact of cloud applications and collaboration tools on productivity, security and cost."
        ],
        expectedStandard: "Cloud-based collaboration tools operated successfully. The impact of cloud applications and collaboration tools on productivity, security, and cost assessed effectively."
      },
      {
        title: "5.19.4 Cloud Networking Basics",
        competencies: ["Describe the fundamentals of cloud networking.", "Configure basic cloud network settings"],
        learningActivities: [
          "Describing the fundamentals of cloud networking.",
          "Configuring basic cloud network settings (Such as: firewall rules, IP addressing, VPN connections)."
        ],
        expectedStandard: "The fundamentals of cloud networking described correctly. Basic cloud network settings configured correctly."
      }
    ]
  }
];

export const advancedComputerScienceForm6: Topic[] = [
  {
    title: "6.1 Fundamentals of Computing",
    subtopics: [
      {
        title: "6.1.1 Central Processing Unit (CPU) Architecture",
        competencies: ["Outline Reduced Instruction Set Computers (RISC) and Complex Instruction Set Computers (CISC) processors.", "Explain the importance of pipelining and registers in RISC processors.", "Identify and explain the four basic computer architectures and their instruction sets.", "Assess the effectiveness of different CPU architectures in meeting specific performance requirements."],
        learningActivities: [
          "Outlining RISC and CISC processors.",
          "Explaining the importance of pipelining and registers in RISC processors.",
          "Identifying and explaining the four basic computer architectures and their instruction sets (SISD, SIMD, MISD, and MIMD).",
          "Assessing the effectiveness of different CPU architectures in meeting specific performance requirements."
        ],
        expectedStandard: "RISC and CISC processors outlined clearly. The importance of pipelining and registers in RISC processors explained correctly. The four basic computer architectures and their instruction sets identified and explained correctly. The effectiveness of different CPU architectures assessed correctly."
      }
    ]
  },
  {
    title: "6.2 Data Structure",
    subtopics: [
      {
        title: "6.2.1 Graphs: Advanced, Implementation and Applications",
        competencies: ["Analyse advanced graph algorithms and their complexities.", "Implement graph algorithms in code.", "Evaluate the efficiency of different graph algorithms.", "Apply graph algorithms to real-world problems."],
        learningActivities: [
          "Analysing Advanced Graph Algorithms and their complexities.",
          "Implementing Graph Algorithms in Code (Such as: Dijkstra’s Algorithm, A* Algorithm, Floyd-Warshall Algorithm, Bellman-Ford Algorithm …).",
          "Evaluating the efficiency of different graph algorithms.",
          "Applying graph algorithms to real-world problems."
        ],
        expectedStandard: "Advanced Graph Algorithms and their complexities analysed effectively. Graph algorithms in code implemented successfully. The efficiency of different graph algorithms evaluated effectively. Graph algorithms to real-world problems applied accurately."
      }
    ]
  },
  {
    title: "6.3 Computational Thinking",
    subtopics: [
      {
        title: "6.3.1 Introduction to Computational Thinking",
        competencies: ["Explain fundamental principles of computational Thinking.", "Apply techniques of fundamental principles to solve complex computational problems.", "Analyse the efficiency, advantages, and limitations of computational thinking fundamental principles techniques.", "Create innovative solutions for complex real-world problems."],
        learningActivities: [
          "Explaining the fundamental principles of computational thinking (Such as: Dynamic Programming, Divide and Conquer, and Backtracking …)",
          "Applying techniques of fundamental principles to solve complex computational problems.",
          "Analysing the efficiency, advantages, and limitations of computational thinking fundamental principles.",
          "Creating innovative solutions for complex, real-world problems."
        ],
        expectedStandard: "Fundamental principles of computational Thinking explained correctly. Techniques of fundamental principles to solve complex computational problems applied correctly. The efficiency, advantages, and limitations of computational thinking fundamental principles analysed correctly. Innovative solutions for complex, real-world problems created effectively and successfully."
      },
      {
        title: "6.3.2 Real-world Applications Using Computational Thinking.",
        competencies: ["Explain how computational thinking can be applied to solve real-world problems.", "Evaluate the effectiveness of computational thinking in various real-world scenarios.", "Create innovative solutions for complex, real-world challenges using advanced computational techniques."],
        learningActivities: [
          "Explaining how computational thinking can be applied to solve real-world problem",
          "Evaluating the effectiveness of computational thinking in various real-world scenario",
          "Creating Innovative Solutions for complex, real-world challenges using advanced computational techniques."
        ],
        expectedStandard: "Application of computational thinking to solve real-world problems explained effectively. Effectiveness of computational thinking in various real-world scenarios evaluated clearly. Innovative solutions for complex real-world challenges created successfully."
      }
    ]
  },
  {
    title: "6.4 Algorithms",
    subtopics: [
      {
        title: "6.4.1 Advanced Algorithmic Techniques",
        competencies: ["Solve complex problems using advanced algorithms."],
        learningActivities: [
          "Solving complex problems using advanced algorithms (Such as: shortest path problems, minimum spanning trees)."
        ],
        expectedStandard: "Complex problems solved efficiently using advanced algorithms."
      },
      {
        title: "6.4.2 Optimisation of Algorithmic Techniques",
        competencies: ["Solve optimisation problems using different algorithmic techniques", "Apply optimisation of Algorithmic Techniques to solve real-world problems."],
        learningActivities: [
          "Solving optimisation problems using different algorithmic techniques (Such as: Greedy, Gradient Descent, Simulated Annealing, Dynamic Programming and Genetic Algorithms).",
          "Applying optimisation of Algorithmic Techniques to solve real-world"
        ],
        expectedStandard: "Optimisation problems solved using different algorithmic techniques accurately. Optimisation of Algorithmic Techniques to solve real-world problems applied correctly."
      }
    ]
  },
  {
    title: "6.5 Java Programming",
    subtopics: [
      {
        title: "6.5.1 Introduction to Java",
        competencies: ["Explain the role of the Java Virtual Machine (JVM).", "Set up a Java development environment.", "Compare and contrast Java with other programming languages."],
        learningActivities: [
          "Explaining the role of the JVM.",
          "Setting up a Java development environment.",
          "Comparing and contrasting Java with other programming languages."
        ],
        expectedStandard: "The role of the JVM explained correctly. The Java development environment Setup successfully. Java and other programming languages compared and contrasted adequately."
      },
      {
        title: "6.5.2 Basic Java Programming",
        competencies: ["Understand the syntax and elements of Java.", "Write and debug basic Java programs", "Understand the concepts of control flow.", "Implement control flow structures in Java."],
        learningActivities: [
          "Understanding the syntax and elements of Java (Such as: variables, data types, operators, casting …).",
          "Writing and debugging basic Java programs (e.g., \"Hello, World!\").",
          "Understanding the concepts of control flow (branching and loops).",
          "Implementing control flow structures in Java"
        ],
        expectedStandard: "The syntax and elements of Java understood correctly. Basic Java programs written and debugged correctly. The concepts of control flow understood correctly. Control flow structures in Java implemented correctly."
      },
      {
        title: "6.5.3 Arrays",
        competencies: ["Discuss arrays and their elements.", "Create arrays in Java.", "Manipulate different array operations."],
        learningActivities: [
          "Discussing arrays and their elements.",
          "Creating arrays in Java.",
          "Manipulating different array operations."
        ],
        expectedStandard: "Arrays and their elements discussed correctly. Arrays in Java created correctly. Different array operations manipulated correctly."
      },
      {
        title: "6.5.4 Object Oriented Programming (OOP)",
        competencies: ["Discuss classes, objects and attributes.", "Discuss the pillars of OOP and their benefits in software development.", "Create classes and objects in Java.", "Design and implement applications in Java using the pillars of OOP."],
        learningActivities: [
          "Discussing classes, objects and attributes.",
          "Discussing the pillars of OOP (abstraction, inheritance, polymorphism, and encapsulation) and their benefits in software development.",
          "Creating classes and objects in Java.",
          "Designing and implementing applications in Java using the pillars of OOP."
        ],
        expectedStandard: "Classes, objects and attributes discussed correctly. The pillars of OOP and their benefits in software development discussed adequately. Classes and objects in Java created successfully. Applications in Java using the pillars of OOP designed and implemented successfully."
      },
      {
        title: "6.5.5 Methods",
        competencies: ["Discuss methods and their parameters.", "Explain the concept of method calls and return values.", "Create and use methods in Java programs."],
        learningActivities: [
          "Discussing methods and their parameters.",
          "Explaining the concept of method calls and return values.",
          "Creating and demonstrating use of methods in Java programs."
        ],
        expectedStandard: "Methods and their parameters discussed correctly. Concept of method calls and return values explained correctly. Methods in Java programs created and used correctly."
      },
      {
        title: "6.5.6 Exception Handling",
        competencies: ["Discuss exceptions and their importance in Java.", "Explain the try-catch-finally block.", "Write Java programs that handle exceptions.", "Evaluate the effectiveness of exception handling in Java programs.", "Design and implement exception handling mechanisms in Java applications."],
        learningActivities: [
          "Discussing exceptions and their importance in Java.",
          "Explaining the try-catch-finally block.",
          "Writing Java programs that handle exceptions.",
          "Evaluating the effectiveness of exception handling in Java programs.",
          "Designing and implementing exception handling mechanisms in Java applications."
        ],
        expectedStandard: "Exceptions and their importance in Java discussed correctly. Try-catch-finally block explained correctly. Java programs that handle exception written accurately. Exception handling in Java programs effectively evaluated. Exception handling mechanisms in Java applications designed and implemented successfully."
      }
    ]
  },
  {
    title: "6.6 Operating Systems",
    subtopics: [
      {
        title: "6.6.1 Operating Systems",
        competencies: ["Analyse and document system design and resource management.", "Present findings and recommendations from research on system design and resource management."],
        learningActivities: [
          "Analysing and documenting system design and resource management.",
          "Presenting findings and recommendations from research on system design and resource management."
        ],
        expectedStandard: "System design and resource management analysed effectively. Findings and recommendations from research on system design and resource management presented correctly."
      },
      {
        title: "6.6.2 Advanced Process Management Techniques",
        competencies: ["Create flowcharts and simulations to model the states and transitions of the process lifecycle"],
        learningActivities: [
          "Creating flowcharts and simulations to model the states and transitions of the process lifecycle (Such as: new, ready, running, waiting, terminated …)."
        ],
        expectedStandard: "Flowcharts and simulations to model the states and transitions of the process lifecycle created successfully."
      },
      {
        title: "6.6.3 Advanced File Systems and Storage Management",
        competencies: ["Evaluate file systems and storage management.", "Optimise data organization, access, and performance."],
        learningActivities: [
          "Evaluating file systems and storage management.",
          "Optimising data organization, access, and performance."
        ],
        expectedStandard: "File systems and storage management evaluated successfully. Data organization, access, and performance optimised effectively."
      }
    ]
  },
  {
    title: "6.7 Networking",
    subtopics: [
      {
        title: "6.7.1 Networking Infrastructure and Security",
        competencies: ["Discuss network infrastructure components.", "Configure network infrastructure components.", "Design, using simulation tools, a network architecture that uses VLANs, QoS, and SDN.", "Discuss the key concepts in network security."],
        learningActivities: [
          "Discussing network infrastructure components (Such as: routers, switches, firewalls, access points, servers …)",
          "Configuring network infrastructure components (Such as: IP addressing, routing, switching, firewall rules …).",
          "Creating using simulation tools (Such as: Cisco Packet Tracer, Network Simulator 3 (NS3), Mininet), a network architecture that uses VLANs, QoS, and SDN.",
          "Discussing the key concepts in network security (Such as: firewall, encryption, VPN, intrusion detection …)."
        ],
        expectedStandard: "Networking infrastructure components discussed correctly. Network infrastructure components configured successfully. Network architectures that use VLANs, QoS, and SDN created successfully. The key concepts in network security discussed thoroughly."
      },
      {
        title: "6.7.2 Wireless Networks",
        competencies: ["Explain the functions of different wireless network devices.", "Design a wireless network plan.", "Implement a wireless network by installing and configuring a wireless router and access point.", "Diagnose network connectivity issues using appropriate network diagnostic tools."],
        learningActivities: [
          "Explaining the functions of different wireless network devices.",
          "Designing a wireless network plan.",
          "Implementing a wireless network by installing and configuring a wireless router and access point.",
          "Diagnosing network connectivity issues using appropriate network diagnostic tools ( ping, tracer router, network analysers ...)"
        ],
        expectedStandard: "Functions of different wireless network devices explained correctly. A wireless network plan designed accurately and successfully. Wireless networks implemented successfully. Network connectivity issues diagnosed correctly using appropriate network diagnostic tools."
      }
    ]
  },
  {
    title: "6.8 Database Management",
    subtopics: [
      {
        title: "6.8.1 Database Design and Optimization",
        competencies: ["Explain factors that influence database design and performance.", "Explain the principles of database optimisation.", "Optimise database designs for performance and scalability, including large-scale database systems.", "Evaluate the impact of database design decisions on performance."],
        learningActivities: [
          "Explaining factors that influence database design and performance.",
          "Explaining the principles of database optimisation.",
          "Optimising database designs for performance and scalability, including large-scale database systems.",
          "Evaluating the impact of database design decisions on performance."
        ],
        expectedStandard: "Factors that influence database design and performance correctly explained. The principles of database optimisation explained clearly. Database designs for performance and scalability optimised successfully. Impact of database design decisions on performance evaluated correctly."
      },
      {
        title: "6.8.2 NoSQL Databases",
        competencies: ["Describe NoSQL databases and their characteristics.", "Explain the advantages and disadvantages of NoSQL databases compared to relational databases.", "Demonstrate the use of popular NoSQL databases", "Evaluate the suitability of NoSQL databases for different applications.", "Design and implement a NoSQL database for different applications"],
        learningActivities: [
          "Describing NoSQL databases and their characteristics.",
          "Explaining the advantages and disadvantages of NoSQL databases compared to relational databases.",
          "Demonstrating the use of popular NoSQL databases (Such as: MongoDB, Cassandra, Redis).",
          "Evaluating the suitability of NoSQL databases for different applications.",
          "Designing and implementing a NoSQL database for different applications."
        ],
        expectedStandard: "NoSQL databases and their characteristics described correctly. The advantages and disadvantages of NoSQL databases compared to relational databases explained clearly. Popular NoSQL databases used accurately. The suitability of NoSQL databases for different applications evaluated successfully. NoSQL database for different applications designed and implemented successfully."
      },
      {
        title: "6.8.3 Database Security",
        competencies: ["Identify common database security threats and vulnerabilities.", "Explain the principles of database security.", "Implement security measures for databases.", "Evaluate the effectiveness of database security measures for databases.", "Design a database security plan for a specific application or organization."],
        learningActivities: [
          "Identifying common database security threats and vulnerabilities.",
          "Explaining the principles of database security.",
          "Implementing security measures for databases",
          "Evaluating the effectiveness of database security measures for databases.",
          "Designing a database security plan for a specific application or organization."
        ],
        expectedStandard: "Common database security threats and vulnerabilities identified correctly. The principles of database security explained clearly. Security measures for databases implemented successfully. The effectiveness of database security measures for databases evaluated correctly. Database security plan for a specific application or organization designed clearly."
      },
      {
        title: "6.8.4 Database Tuning and Optimization",
        competencies: ["Identify factors that affect database performance.", "Explain the techniques for database tuning and optimization.", "Optimize database performance using tuning tools and techniques.", "Evaluate the impact of database tuning on performance."],
        learningActivities: [
          "Identifying factors that affect database performance.",
          "Explaining the techniques for database tuning and optimization (Such as: indexing, query optimization, caching …).",
          "Optimizing database performance using tuning tools and techniques.",
          "Evaluating the impact of database tuning on performance."
        ],
        expectedStandard: "Factors that affect database performance identified correctly. The techniques for database tuning and optimization explained well. Database performance optimised efficiently using tuning tools and techniques. The impact of database tuning on performance evaluated correctly."
      },
      {
        title: "6.8.5 Graph Databases",
        competencies: ["Discuss graph databases and their characteristics.", "Explain the advantages and disadvantages of graph databases compared to relational and NoSQL databases.", "Use popular graph databases.", "Evaluate the suitability of graph databases for different applications.", "Design and implement a graph database for specific applications."],
        learningActivities: [
          "Discussing graph databases and their characteristics.",
          "Explaining the advantages and disadvantages of graph databases compared to relational and NoSQL databases.",
          "Using popular graph databases.",
          "Evaluating the suitability of graph databases for different applications.",
          "Designing and implementing a graph database for specific applications."
        ],
        expectedStandard: "Graph databases and their characteristics discussed adequately. The advantages and disadvantages of graph databases compared to relational and NoSQL databases clearly explained. Popular graph databases accurately used. The suitability of graph databases for different applications correctly evaluated. Graph databases for specific applications designed and implemented successfully."
      }
    ]
  },
  {
    title: "6.9 Software Development",
    subtopics: [
      {
        title: "6.9.1 Advanced Software Engineering Principles",
        competencies: ["Describe key advanced software engineering principles.", "Assess the impact of advanced software engineering principles on software quality and development efficiency.", "Analyse software engineering plans to identify risks and recommend appropriate mitigation strategies.", "Create documentation and guidelines for implementing advanced software engineering practices."],
        learningActivities: [
          "Describing key advanced software engineering principles (Such as: modularity, abstraction, encapsulation, SOLID principles, DRY, KISS …).",
          "Assessing the impact of advanced software engineering principles on software quality and development efficiency.",
          "Analysing software engineering plan to identify risks and suggesting mitigation strategies.",
          "Creating documentation and guidelines for implementing advanced software engineering practices."
        ],
        expectedStandard: "Key advanced software engineering principles described correctly. The impact of advanced software engineering principles on software quality and development efficiency assessed effectively. Software engineering risks identified and appropriate mitigation strategies recommended correctly. Documentation and guidelines for implementing advanced software engineering practices created successfully."
      },
      {
        title: "6.9.2 Design patterns",
        competencies: ["Explain the importance of software design patterns and their role in software development.", "Implement advanced design patterns.", "Evaluate the effectiveness of various design patterns in solving specific software engineering problems.", "Design software systems to address specific requirements and constraints."],
        learningActivities: [
          "Explaining the importance of software design patterns and their role in software development.",
          "Implementing advanced design patterns (e.g., Singleton, Observer, Factory) in a sample software project.",
          "Evaluating the effectiveness of various design patterns in solving specific software engineering problems.",
          "Designing software systems incorporating advanced principles (modular architecture and design patterns) to address specific requirements and constraints."
        ],
        expectedStandard: "Importance of software design patterns and their role in software development explained correctly. Advanced design patterns implemented successfully. The effectiveness of various design patterns in solving specific software engineering problems evaluated correctly. Software systems to address specific requirements and constraints designed successfully."
      }
    ]
  },
  {
    title: "6.10 Web Technology",
    subtopics: [
      {
        title: "6.10.1 Web Development Project",
        competencies: ["Identify the requirements of a given real-world problem.", "Develop and implement a web-based information system using HTML, CSS, JavaScript, MySQL, PHP, and web frameworks.", "Deploy the system to a web server."],
        learningActivities: [
          "Identifying the requirements of a given real-world problem.",
          "Developing and implementing a web-based information system using HTML, CSS, JavaScript, MySQL, PHP, and web frameworks.",
          "Deploying the system to a web server."
        ],
        expectedStandard: "The requirements of a given real-world problem identified correctly. HTML, CSS, JavaScript, MySQL, PHP, and web frameworks developed and implemented correctly. The system to a web server deployed successfully."
      },
      {
        title: "6.10.2 Project Reporting",
        competencies: ["Write a comprehensive capstone project report.", "Demonstrate and present capstone projects to an audience"],
        learningActivities: [
          "Writing a comprehensive capstone project report (including introduction, methodology, implementation, testing, evaluation, and conclusion).",
          "Demonstrating and presenting capstone projects to an audience (e.g. classmates, teachers, industry panel …)."
        ],
        expectedStandard: "A comprehensive capstone project report written accurately and correctly. Capstone projects demonstrated and presented effectively to an audience"
      }
    ]
  },
  {
    title: "6.11 Data Science And Analytics",
    subtopics: [
      {
        title: "6.11.1 Introduction to Big Data",
        competencies: ["Explain the principles of big data, including its characteristics.", "Explore big data storage solutions and databases.", "Build and deploy a real-time data pipeline using tools and frameworks to ingest, process, and analyse data instantly."],
        learningActivities: [
          "Explaining principles of big data (Such as: volume, velocity, variety, veracity, value …).",
          "Exploring big data storage solutions and databases (Such as: Hadoop Distributed File System (HDFS), NoSQL …).",
          "Bulding and deploying real-time data pipelines using tools and frameworks (Such as: Apache Kafka, Spark Streaming, Flink …) to ingest, process, and analyse data instantly."
        ],
        expectedStandard: "Principles of big data explained correctly. Big data storage solutions and databases explored effectively. Real-time data pipelines successfully built and deployed successfully."
      },
      {
        title: "6.11.2 Data Engineering",
        competencies: ["Identify and select relevant features within a dataset using appropriate feature engineering techniques", "Transform data and generate new features from existing data using appropriate feature engineering methods."],
        learningActivities: [
          "Identifying and selecting relevant features within a dataset using appropriate feature engineering techniques (feature selection, feature extraction, transformation, encoding…)",
          "Transforming data and generating new features from existing data using appropriate feature engineering method (scaling, normalizing, …)"
        ],
        expectedStandard: "Relevant features identified and selected from a dataset using appropriate feature engineering techniques correctly. Data transformed and new features generated from existing data using appropriate feature engineering methods"
      },
      {
        title: "6.11.3 Data Governance and ethics",
        competencies: ["Identify cloud-based data storage solutions, including data lakes and data warehouses.", "Explore policies for data quality, security, and compliance.", "Discuss and analyse ethical issues and data privacy laws"],
        learningActivities: [
          "Identifying cloud-based data storage solutions, including data lakes and data warehouses (Such as: AWS S3, Google BigQuery, Azure Data Lake …).",
          "Exploring policies for data quality, security and compliance.",
          "Discussing and analysing ethical issues and data privacy laws"
        ],
        expectedStandard: "Cloud-based data storage solutions, including data lakes and data warehouses identified clearly. Policies for data quality, security, and compliance explored thoroughly. Ethical issues and data privacy laws adequately discussed and analysed."
      },
      {
        title: "6.11.4 Data Analytics",
        competencies: ["Analysing past data trends using descriptive analytics.", "Identify causes of trends and anomalies using diagnostic Analytics."],
        learningActivities: [
          "Analysing past data trends using descriptive analytics.",
          "Identifying causes of trends and anomalies using diagnostic Analytics."
        ],
        expectedStandard: "Past data trends analysed effectively. Causes of trends and anomalies identified accurately."
      }
    ]
  },
  {
    title: "6.12 Cybersecurity",
    subtopics: [
      {
        title: "6.12.1 Legal and Ethical Aspects of Cybersecurity",
        competencies: ["Explain the Zambia Information and Communication Technologies Act and the national cybersecurity legal framework.", "Describe procedures for reporting cybercrime in Zambia.", "Explain digital rights and responsibilities in the use of technology.", "Demonstrate ethical use of digital content and online resources"],
        learningActivities: [
          "Explaining the Zambia Information and Communication Technologies Act and the national cybersecurity legal framework.",
          "Describing procedures for reporting cybercrime in Zambia",
          "Explaining digital rights and responsibilities in the use of technolog",
          "Demonstrating ethical use of digital content and online resources"
        ],
        expectedStandard: "Zambian Information and Communication Technologies Act and the national cybersecurity legal framework explained correctly. Procedures for reporting cybercrime in Zambia described accurately. Digital rights and responsibilities in the use of technology explained clearly. Ethical use of digital content and online resources demonstrated correctly"
      },
      {
        title: "6.12.2 Cybersecurity Tools and Software Awareness",
        competencies: ["Demonstrate the use of security tools to protect computer systems.", "Explain the use of browser extensions for online safety and secure browsing", "Practice safe use of public Wi-Fi and VPNs", "Explain simple threat detection mechanisms in cybersecurity.", "Discuss hardware and software security.", "Develop and execute a password management plan."],
        learningActivities: [
          "Demonstrating the use of security tools (Such as: antivirus, firewalls, and anti-malware…) in protecting computer systems.",
          "Explaining the use of browser extensions for online safety and secure browsing.",
          "Practicing safe use of public Wi-Fi and VPNs",
          "Explaining simple threat detection mechanisms (e.g. Antivirus scanning, Firewall monitoring, Login monitoring, Email filtering …) in cybersecurity.",
          "Discussing hardware and software security (meltdown, spectre, TEE Virtualization and Cloud computing security Mobile security and IoT security)",
          "Developing and executing a password management plan."
        ],
        expectedStandard: "Use of security tools to protect computer systems demonstrated properly. Use of browser extensions for online safety and secure browsing explained clearly. Safe use of public Wi-Fi and VPNs practiced properly. Simple threat detection mechanisms in cybersecurity explained well. Hardware and software security discussed well. Password management plan developed and executed correctly"
      },
      {
        title: "6.12.3 Basic Computer Forensics",
        competencies: ["Describe the social implications of cybersecurity.", "Analyse the risks and benefits of social networks.", "Discuss various ethical hacking procedures", "Conduct various ethical hacking procedures using simulation tools"],
        learningActivities: [
          "Describing the social (positive and negative) implications of cybersecurity.",
          "Analysing the risks and benefits of social networks.",
          "Discussing various ethical hacking procedures (e.g: Password strength testing, Vulnerability scanning, Network scanning, Penetration testing, Phishing simulation, security auditing…).",
          "Conducting various ethical hacking procedures using simulation tools (John the Ripper, OpenVAS, Nmap, Metasploit Framework, Gophish, Lynis, Kali Linux…)"
        ],
        expectedStandard: "Social implications of cybersecurity described well. Risks and benefits of social networks analysed properly. Various ethical hacking procedures discussed well. Various ethical hacking procedures using simulation tools conducted properly"
      },
      {
        title: "6.12.4 Network Security, Web Security and Firewalls",
        competencies: ["Discuss Threats to network", "Explain the fundamentals of Intrusion Detection Systems (IDS) and Intrusion Prevention Systems (IPS) in securing computer networks.", "Discuss hardware and software firewalls in network security.", "Explain Virtual Private Network (VPN) protocols and encrypted communication in network security.", "Apply secure network segmentation techniques in network security.", "Explain the importance of Network Access Control (NAC) in network security."],
        learningActivities: [
          "Discussing threats to network (data interception, replay attack, port scanning, DoS, DDoS, MITM Network defense: IPsec, VPN, Firewalls Browser attacks …)",
          "Explaining the fundamentals of IDS and IPS in securing computer networks.",
          "Discussing hardware and software firewalls in network security.",
          "Explaining VPN protocols and encrypted communication in network security.( OpenVPN, IPSec, SSL/TLS, WireGuard, HTTPS, SSH, and SFTP…)",
          "Applying secure network segmentation techniques in network security (VLANs, subnetting, firewalls, DMZs, ACLs, micro-segmentation …)",
          "Explaining the importance of NAC in network security."
        ],
        expectedStandard: "Threats to network discussed well. Fundamentals of IDS and IPS in securing computer networks explained well. Hardware and software firewalls in network security discussed well. VPN protocols and encrypted communication in network security explained well. Network segmentation techniques in network security applied and secured properly. The importance of NAC in network security explained well."
      }
    ]
  },
  {
    title: "6.13 Cloud Computing",
    subtopics: [
      {
        title: "6.13.1 Security Policies and Procedures",
        competencies: ["Discuss security policies and procedures and their importance in cloud environments.", "Develop and implement security policies and procedures for a cloud environment.", "Evaluate the effectiveness of existing security policies and procedures."],
        learningActivities: [
          "Discussing security policies (Access Control Policy, Data Encryption Policy, Acceptable Use Policy …) and procedures (Data Backup and Recovery Procedure, User Account Management Procedure, Security Update and Patch Management Procedure ….) and their importance in cloud environments.",
          "Developing and implementing security policies and procedures for a cloud environment.",
          "Evaluating the effectiveness of existing security policies and procedures."
        ],
        expectedStandard: "Security policies and procedures and their importance in cloud environments discussed adequately. Security policies and procedures for a cloud environment developed and maintained correctly. Effectiveness of existing security policies and procedures evaluated correctly."
      },
      {
        title: "6.13.2 Risk Assessment and Management",
        competencies: ["Describe Risk Assessment and Management.", "Explain the steps involved in a risk assessment process.", "Conduct a Risk Assessment for a cloud environment.", "Evaluate the potential impact of identified risks.", "Develop a risk management plan to mitigate identified risks."],
        learningActivities: [
          "Describing risk assessment and management.",
          "Explaining the steps involved in a risk assessment process.",
          "Conducting a risk assessment for a cloud environment.",
          "Evaluating the potential impact of identified risks.",
          "Developing a risk management plan to mitigate identified risks."
        ],
        expectedStandard: "Risk assessment and management described correctly. Steps involved in a risk assessment process well explained. Risk assessment for a cloud environment conducted successfully. Potential impact of identified risks evaluated correctly. A risk management plan to mitigate identified risks developed successfully."
      },
      {
        title: "6.13.3 Compliance with Industry Standards",
        competencies: ["Describe and examine industry standards and regulations in cloud computing.", "Analyse cloud systems for compliance with relevant standards and regulations.", "Formulate compliance measures for a cloud environment."],
        learningActivities: [
          "Describing and examining industry standards and regulations in Cloud computing (Such as: ISO 27001, GDPR, HIPAA, SOC 2).",
          "Analysing cloud systems for compliance with relevant standards and regulations.",
          "Formulating compliance measures for a cloud environment."
        ],
        expectedStandard: "Industry standards and regulations in cloud computing described and examined correctly. Cloud systems analysed accurately for compliance with relevant standards and regulations. Compliance measures for a cloud environment formulated successfully."
      },
      {
        title: "6.13.4 Security Audits and Certifications",
        competencies: ["Conduct Security Audits for a cloud environment.", "Explain the purpose of security certifications for a cloud environment.", "Evaluate the results of Security Audits and Certifications."],
        learningActivities: [
          "Conducting security audits for a cloud environment.",
          "Explaining the purpose of security certifications for a cloud environment.",
          "Evaluating the results of Security Audits and Certifications."
        ],
        expectedStandard: "Security audits for a cloud environment conducted correctly. The purpose of security certifications for a cloud environment explained clearly. The results of security audits and certifications evaluated clearly."
      },
      {
        title: "6.13.5 Incident Response Planning",
        competencies: ["Explain the steps involved in an Incident Response process.", "Develop an Incident Response plan for a cloud environment.", "Evaluate the effectiveness of incident response plans.", "Conduct tabletop exercises to test an incident response plan."],
        learningActivities: [
          "Explaining the steps involved in an incident response process.",
          "Developing an incident response plan for a cloud environment.",
          "Evaluating the effectiveness of incident response plans.",
          "Conducting a tabletop exercise to test an incident response plan."
        ],
        expectedStandard: "The steps involved in an incident response process explained correctly. Incident response plan for a cloud environment developed successfully. The effectiveness of incident response plans evaluated correctly. Tabletop exercises to test incident response plans conducted successfully."
      }
    ]
  },
  {
    title: "6.14 Artificial Intelligence (Ai)",
    subtopics: [
      {
        title: "6.14.1 Transfer Learning",
        competencies: ["Describe transfer learning.", "Explain the benefits of transfer learning for deep learning models.", "Perform transfer learning tasks using pre-trained deep learning models.", "Evaluate the effectiveness of transfer learning compared to training from scratch."],
        learningActivities: [
          "Describing transfer learning.",
          "Explaining the benefits of transfer learning for deep learning models.",
          "Perform transfer learning tasks using pre-trained deep learning models.",
          "Evaluating the effectiveness of transfer learning compared to training from scratch."
        ],
        expectedStandard: "Transfer learning described adequately. Benefits of transfer learning for deep learning models explained clearly. Pre-trained deep learning models used correctly to perform transfer learning tasks. Effectiveness of transfer learning compared to training from scratch evaluated correctly."
      }
    ]
  },
  {
    title: "6.15 Internet Of Things (Iot)",
    subtopics: [
      {
        title: "6.15.1 Internet of Things architecture",
        competencies: ["Develop scalable Internet of Things Systems"],
        learningActivities: [
          "Developing scalable Internet of Things Systems (Such as: Smart Home, Automation System, Smart City …)."
        ],
        expectedStandard: "Scalable Internet of Things systems developed successfully."
      },
      {
        title: "6.15.2 Internet of Things Security",
        competencies: ["Implement the authentication and encryption mechanisms in Internet of Things systems."],
        learningActivities: [
          "Implementing the authentication and encryption mechanisms in Internet of Things systems."
        ],
        expectedStandard: "Authentication and encryption mechanisms implemented successfully."
      },
      {
        title: "6.15.3 Industry Applications",
        competencies: ["Design the Internet of Things solutions for industrial applications."],
        learningActivities: [
          "Designing the Internet of Things solutions for industrial applications."
        ],
        expectedStandard: "Internet of Things solutions for industrial applications designed successfully."
      }
    ]
  },
  {
    title: "6.16 Human-Computer Interaction",
    subtopics: [
      {
        title: "6.16.1 Advanced Human-Computer Interaction (HCI) techniques",
        competencies: ["Discuss HCI techniques.", "Design and develop interactive systems using HCI techniques.", "Analyse the ethical implications of HCI techniques on user privacy and data security.", "Develop strategies to improve accessibility in interactive systems using HCI techniques."],
        learningActivities: [
          "Discussing HCI techniques (Such as: UCD, URT, Usability testing …).",
          "Designing and developing interactive systems using HCI techniques.",
          "Analysing the ethical implications of HCI techniques on user privacy and data security.",
          "Developing strategies to improve accessibility in interactive systems using HCI techniques."
        ],
        expectedStandard: "HCI techniques discussed thoroughly. Interactive systems designed and developed successfully using HCI techniques. Ethical implications of HCI techniques on user privacy and data security analysed correctly. Strategies to improve accessibility in interactive systems using HCI techniques developed successfully."
      }
    ]
  },
  {
    title: "6.17 Basic Electronics",
    subtopics: [
      {
        title: "6.17.1 Boolean algebra fundamentals",
        competencies: ["Explain the fundamental laws of Boolean Algebra.", "Apply Boolean Algebra laws to simplify complex Boolean expressions.", "Implement simplified Boolean expressions using logic gates."],
        learningActivities: [
          "Explaining the fundamental laws of Boolean Algebra (Such as: Cummulative, associative, Distributive, De Morgan’s …).",
          "Applying Boolean Algebra laws to simplify complex Boolean expressions.",
          "Implementing simplified Boolean expressions using logic gates"
        ],
        expectedStandard: "Fundamental laws of Boolean Algebra clearly explained. Boolean Algebra laws to simplify complex Boolean expressions applied correctly. Simplified Boolean expressions implemented successfully."
      },
      {
        title: "6.17.2 Electrical Components",
        competencies: ["Describe key electrical components", "Explain the behavior of passive components in circuit configurations.", "Design and construct simple electronic circuits using appropriate components to solve basic problems"],
        learningActivities: [
          "Describing key electrical components",
          "Explaining the behavior of passive components (resistor, capacitor, inductor) in circuit configurations.",
          "Designing and constructing simple electronic circuits using appropriate components to solve basic problems (Such as: LED circuit, voltage divider, light sensor …)."
        ],
        expectedStandard: "Key electrical components correctly described. Passive components in circuit configurations explained correctly. Simple electronic circuits designed and constructed correctly using appropriate components to solve basic problem"
      }
    ]
  }
];
