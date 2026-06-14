/**
 * seed_recommendations.js
 * Seeds SyllabusRecommendation documents for:
 *   - ECE 4th Semester (BS-202, HS-204, EEC-206, ECC-210, ECC-212, ECC-214, ECC-213)
 *   - BBA 2nd Semester (BBA-102, BBA-104, BBA-106, BBA-108, BBA-112, BBA-118)
 *
 * Run: node src/seed_recommendations.js
 */

import mongoose from 'mongoose';
import SyllabusRecommendation from './models/syllabusRecommendation.model.js';

const MONGO_URI = 'mongodb://127.0.0.1:27017/bpit_v1';

const recommendations = [
  // ─────────────────────────────────────────────────────────────────────
  // ECE – 4th SEMESTER
  // ─────────────────────────────────────────────────────────────────────
  {
    branch: 'ECE',
    semester: 4,
    subjectCode: 'BS202',
    subjectName: 'Probability, Statistics & Linear Programming',
    credits: 4,
    topics: [
      'Probability Axioms & Bayes Theorem',
      'Random Variables & Distributions (Binomial, Poisson, Normal)',
      'Joint Probability & Covariance',
      'Sampling & Central Limit Theorem',
      'Hypothesis Testing (t-test, chi-square)',
      'Regression & Correlation',
      'Linear Programming – Graphical Method',
      'Simplex Method & Duality',
      'Transportation & Assignment Problems',
    ],
    insight:
      'This is the most math-heavy subject in Sem 4. Focus on clearly understanding probability distributions and then jump to LP formulation. The Simplex method is a sure-shot scoring topic in exams.',
    weakAreas: [
      'Simplex & Dual Simplex Method',
      'Hypothesis Testing (Type I & II errors)',
      'Joint Distributions & Conditional Probability',
    ],
    strengths: 'Basic Probability & Bayes Theorem',
    improvementPlan: [
      { title: 'Master Probability Distributions', description: 'Solve 10 problems each for Binomial, Poisson, and Normal distributions from Montgomery & Runger textbook. Focus on finding mean & variance.' },
      { title: 'Practice Simplex Iterations', description: 'Work through at least 5 full Simplex method problems end-to-end, including pivoting and identifying optimal solution.' },
      { title: 'Hypothesis Testing Drill', description: 'Understand when to use t-test vs z-test vs chi-square. Solve GGSIPU PYQs from last 5 years on this topic.' },
    ],
    studyPlan: [
      { week: 'Week 1', title: 'Probability & Distributions', description: 'Cover Unit I: Probability axioms, Bayes Theorem, and all discrete/continuous distributions. Solve 20 problems.' },
      { week: 'Week 2', title: 'Statistics – Hypothesis & Regression', description: 'Cover Unit II & III: Joint distributions, CLT, hypothesis testing, and regression analysis. Focus on PYQs.' },
      { week: 'Week 3', title: 'Linear Programming & Mock Exam', description: 'Cover Unit IV: LP formulation, Simplex, Duality, Transportation & Assignment. Do a full mock paper in 3 hours.' },
    ],
  },

  {
    branch: 'ECE',
    semester: 4,
    subjectCode: 'HS204',
    subjectName: 'Technical Writing',
    credits: 2,
    topics: [
      'Grammar – Subject-Verb Agreement, Sentence Types',
      'Synonyms, Antonyms, Word Formation',
      'Precis & Visual Aids in Technical Writing',
      'Proposal & Dialogue Writing',
      'Business Letter Writing (Request, Sales, Complaint)',
      'Resume & Cover Letter Writing',
      'Meeting Documentation – Notice, Minutes, Agenda',
      'Business Ethics & SWOT Analysis',
      'Emotional Intelligence & Leadership',
    ],
    insight:
      'NUES paper – all exams conducted by your teacher. Focus on format-based questions: letters, memos, resumes. The 1st unit grammar section often has surprising twists on word usage.',
    weakAreas: [
      'Formal Letter Formats',
      'Precis Writing (conciseness)',
      'Meeting Documentation Templates',
    ],
    strengths: 'Grammar & Vocabulary',
    improvementPlan: [
      { title: 'Perfect 5 Letter Formats', description: 'Practice writing Request, Sales, Complaint, Job Application, and Memorandum with correct layout and tone. Get them reviewed.' },
      { title: 'Precis Writing Practice', description: 'Take 3 long passages and condense them to 1/3rd length. Focus on retaining key ideas without personal commentary.' },
      { title: 'Grammar Intensive Review', description: 'Do 50 MCQ grammar exercises covering Subject-Verb agreement, Tenses, and Connectives from Meenakshi Raman textbook.' },
    ],
    studyPlan: [
      { week: 'Week 1', title: 'Grammar & Vocabulary Foundation', description: 'Complete Unit I: sentence types, word formation, Indianisms, antonyms/synonyms. Do 30 exercise problems.' },
      { week: 'Week 2', title: 'Writing Styles & Business Documents', description: 'Cover Units II & III: writing styles, proposal types, all business letter formats, resume writing.' },
      { week: 'Week 3', title: 'Ethics & Mock Exam', description: 'Cover Unit IV: Business ethics, SWOT, JOHARI Window. Do one full mock paper and review teacher notes.' },
    ],
  },

  {
    branch: 'ECE',
    semester: 4,
    subjectCode: 'EEC206',
    subjectName: 'Network Analysis and Synthesis',
    credits: 3,
    topics: [
      'Mesh & Node Analysis in AC Circuits',
      'Network Theorems – Thevenin, Norton in AC',
      'Graph Theory – Tree, Tie-set, Cut-set Matrix',
      'Laplace Transform of Complex Waveforms',
      'Transient Response of RLC Circuits',
      'Two-Port Network Parameters (Z, Y, H, ABCD)',
      'Interconversion of Two-Port Parameters',
      'Hurwitz Polynomial & Positive Real Functions',
      'Synthesis – Foster & Cauer Forms (LC, RC, RL)',
      'Passive Filter Design (LP, HP, BP, BR)',
    ],
    insight:
      'Network Analysis builds on Circuits from Sem 1. Two-port parameters and LC synthesis are high-scoring conceptual topics in GGSIPU papers. Master Laplace transforms first – everything else follows.',
    weakAreas: [
      'Two-Port Parameter Interconversion',
      'Foster & Cauer Network Synthesis',
      'Hurwitz Polynomial Testing',
    ],
    strengths: 'Basic Mesh & Node Analysis',
    improvementPlan: [
      { title: 'Two-Port Parameters Deep Dive', description: 'Practice converting between Z, Y, h, and ABCD parameters for at least 8 different two-port networks. Use Van Valkenburg reference.' },
      { title: 'Laplace Transform Problems', description: 'Solve 10 transient response problems using Laplace transform for RLC circuits with step, impulse, and ramp inputs.' },
      { title: 'Filter Synthesis Practice', description: 'Design a 3rd-order LC Low Pass filter using Foster Form I and verify by computing transfer function.' },
    ],
    studyPlan: [
      { week: 'Week 1', title: 'AC Circuit Theorems & Graph Theory', description: 'Master Unit I: Mesh/Node in AC, Thevenin/Norton, and graph theory matrices (tie-set, cut-set). Solve 15 problems.' },
      { week: 'Week 2', title: 'Laplace Transforms & Two-Port Networks', description: 'Cover Units II & III: Transient response via Laplace, two-port parameters and their interconversion.' },
      { week: 'Week 3', title: 'Network Synthesis & Filters', description: 'Cover Unit IV: Hurwitz polynomial, Foster/Cauer synthesis of LC/RC/RL, passive filter classification and design.' },
    ],
  },

  {
    branch: 'ECE',
    semester: 4,
    subjectCode: 'ECC210',
    subjectName: 'Microprocessors and Microcontrollers',
    credits: 3,
    topics: [
      '8085 Architecture & PIN Diagram',
      '8085 Timing Diagram & Addressing Modes',
      '8085 Assembly Language Programming',
      '8086 Architecture & Physical Address Generation',
      '8086 Instruction Set & Assembly Programs',
      '8086 Hardware/Software Interrupts',
      'Interfacing 8255 PPI with 8086',
      'Interfacing 8253/8254 Timer & 8251 USART',
      '8259 PIC, DAC/ADC, LCD, Stepper Motor',
      '8051 Microcontroller Architecture & Memory',
      '8051 Instruction Set & Interrupt Programming',
    ],
    insight:
      'Microprocessors is one of the most PYQ-predictable subjects. The 8085 architecture + 8086 memory interfacing + 8051 instructions appear in almost every paper. Understanding the pin diagram and timing cycles is mandatory.',
    weakAreas: [
      '8086 Memory Interfacing & Segments',
      '8051 Timer & Counter Programming',
      'Interfacing Peripheral ICs (8255, 8253)',
    ],
    strengths: '8085 Architecture & Basic Assembly',
    improvementPlan: [
      { title: 'Master 8086 Addressing Modes', description: 'Write 5 assembly language programs covering all addressing modes: immediate, register, direct, indirect, and based-indexed. Trace through execution.' },
      { title: 'Peripheral Interface Practice', description: 'Study Intel 8255 PPI modes of operation (Mode 0, 1, 2). Solve PYQ on initialization word and port configuration.' },
      { title: '8051 Program Execution', description: 'Write programs for LED blinking, 7-segment display, and interrupt-based timer using 8051 assembly. Run on simulator (MIDE-51 or Keil).' },
    ],
    studyPlan: [
      { week: 'Week 1', title: '8085 Microprocessor', description: 'Complete Unit I: 8085 architecture, timing diagrams, addressing modes, interrupt types, and 5 assembly programs.' },
      { week: 'Week 2', title: '8086 + Peripheral Interfacing', description: 'Cover Units II & III: 8086 architecture, memory organization, instruction set, and interfacing (8255, 8253, 8259, ADC/DAC).' },
      { week: 'Week 3', title: '8051 Microcontroller', description: 'Cover Unit IV: 8051 architecture, SFRs, port operations, timer/counter programming, and interrupt handling.' },
    ],
  },

  {
    branch: 'ECE',
    semester: 4,
    subjectCode: 'ECC212',
    subjectName: 'Digital Communications',
    credits: 3,
    topics: [
      'PCM, DPCM & Delta Modulation',
      'Sampling Theorem & Quantization',
      'Line Codes',
      'ASK, FSK, BPSK, QPSK, QAM Modulation',
      'DPSK, MSK, GMSK Techniques',
      'Coherent & Non-Coherent Detection',
      'Intersymbol Interference & Raised Cosine Filtering',
      'Adaptive Equalization & Eye Pattern',
      'OFDM & MIMO Systems',
      'Information Theory – Entropy & Channel Capacity',
      'Error Control Coding – Linear Block, Cyclic, Convolutional',
    ],
    insight:
      'Digital Comm is heavily mathematical. The modulation schemes (BPSK, QPSK, QAM) and information theory section are very important for GGSIPU finals. Eye pattern and ISI questions often appear in 15-mark unit questions.',
    weakAreas: [
      'OFDM & MIMO Concepts',
      'Convolutional Codes & Viterbi Algorithm',
      'Channel Capacity & Shannon Theorem Applications',
    ],
    strengths: 'PCM, Sampling & Basic Modulation',
    improvementPlan: [
      { title: 'Modulation Scheme BER Comparison', description: 'Study and compare BER vs SNR curves for BPSK, QPSK, and 16-QAM. Understand why BPSK is most robust against noise.' },
      { title: 'Information Theory Problems', description: 'Solve 10 problems on entropy, mutual information, channel capacity, and source coding efficiency from Haykin textbook.' },
      { title: 'Error Control Coding Practice', description: 'Practice encoding/decoding using Linear Block Codes (Hamming) and Cyclic Codes (CRC). Understand generator polynomial.' },
    ],
    studyPlan: [
      { week: 'Week 1', title: 'Source Coding & Modulation', description: 'Cover Unit I & II: PCM, Delta Modulation, Line Codes, and all digital modulation schemes (ASK, FSK, BPSK, QPSK, QAM).' },
      { week: 'Week 2', title: 'Band-limited Channels & Fading', description: 'Cover Unit III: ISI, Raised Cosine filtering, Eye Pattern, Adaptive Equalization, OFDM, MIMO, Spread Spectrum.' },
      { week: 'Week 3', title: 'Information Theory & Error Coding', description: 'Cover Unit IV: Entropy, Channel Capacity, Shannon theorem, Linear Block Codes, Cyclic Codes, Convolutional Codes.' },
    ],
  },

  {
    branch: 'ECE',
    semester: 4,
    subjectCode: 'ECC214',
    subjectName: 'Analog Electronics – II',
    credits: 3,
    topics: [
      'Op-Amp Block Diagram & IC 741 Characteristics',
      'Open-loop & Closed-loop Op-Amp Configurations',
      'Practical Op-Amp: Input Bias, Offset, CMRR, SVRR',
      'Frequency Response & Slew Rate',
      'Summing, Scaling & Averaging Amplifiers',
      'Integrator & Differentiator',
      'Comparator, Zero Crossing Detector, Schmitt Trigger',
      'Precision Rectifiers & Sample-Hold Circuit',
      'Oscillators – Phase Shift, Wein Bridge, Square/Triangular Wave',
      'Active Filters – Butterworth LP, HP, BP, BR',
      '555 Timer – Monostable & Astable, PLL Basics',
    ],
    insight:
      'Op-Amp subject is very design-oriented. Learn to draw and analyze all 4 types of amplifier configurations cold. The 555 timer and active filter questions are easy scoring areas if you remember the formulae.',
    weakAreas: [
      'Active Filter Design (Butterworth Order)',
      'PLL Operation Principle',
      'Op-Amp Oscillator Frequency Calculation',
    ],
    strengths: 'Basic Op-Amp Configurations & Comparator',
    improvementPlan: [
      { title: 'Solve 15 Op-Amp Circuit Problems', description: 'Design inverting/non-inverting amplifiers, differentiators, and integrators with given specs. Calculate gain, bandwidth, and output voltage.' },
      { title: 'Active Filter Design Practice', description: 'Design a 2nd-order Butterworth LP filter with fc = 1kHz. Verify using RC component selection from the standard table.' },
      { title: '555 Timer Applications', description: 'Calculate timing for Astable (frequency & duty cycle) and Monostable (pulse width) circuits with at least 5 different RC configurations.' },
    ],
    studyPlan: [
      { week: 'Week 1', title: 'Op-Amp Fundamentals & Frequency Response', description: 'Cover Units I & II: Op-Amp basics, IC 741, open/closed loop configs, practical limitations, slew rate, CMRR.' },
      { week: 'Week 2', title: 'Linear & Non-linear Applications', description: 'Cover Unit III: Summing amplifiers, integrator, differentiator, comparator, Schmitt trigger, oscillators (Wein bridge, phase shift).' },
      { week: 'Week 3', title: 'Active Filters & Specialised ICs', description: 'Cover Unit IV: Butterworth filter design, 555 timer monostable/astable, PLL basics (565), Voltage Regulators (LM317).' },
    ],
  },

  {
    branch: 'ECE',
    semester: 4,
    subjectCode: 'ECC213',
    subjectName: 'Electromagnetic Field Theory',
    credits: 3,
    topics: [
      'Vector Calculus – Gradient, Divergence, Curl',
      'Coordinate Systems – Cartesian, Cylindrical, Spherical',
      'Electrostatics – Electric Field & Potential',
      'Boundary Conditions & Capacitance',
      'Magnetostatics – Biot-Savart & Ampere Laws',
      'Maxwell\'s Equations (Time-Varying)',
      'Electromagnetic Wave Equation',
      'Polarization, Reflection & Refraction of EM Waves',
      'Poynting Vector & Theorem',
      'Transmission Line Equations & Characteristic Impedance',
      'Smith Chart & Impedance Matching',
    ],
    insight:
      'EMT is equation-heavy. Begin with mastering the 3 coordinate systems and vector operations – they are used everywhere. Maxwell\'s equations link everything. The Smith Chart appears in almost every GGSIPU paper.',
    weakAreas: [
      'Smith Chart & Impedance Matching',
      'Maxwell\'s Equations in Integral & Differential Form',
      'Wave Propagation in Lossy Media',
    ],
    strengths: 'Coordinate Systems & Basic Electrostatics',
    improvementPlan: [
      { title: 'Master the Smith Chart', description: 'Practice 6 Smith Chart problems: find reflection coefficient, VSWR, and normalized impedance for given load. Use GGSIPU PYQ Smith Chart problems.' },
      { title: 'Maxwell\'s Equations Applications', description: 'Write all 4 Maxwell equations in differential and integral form. Derive wave equation from them. Solve 5 boundary condition problems.' },
      { title: 'Transmission Line Problems', description: 'Solve standing wave, reflection loss, λ/4 transformer, and stub matching problems. Practice 8 numerical problems from Jordan & Balman.' },
    ],
    studyPlan: [
      { week: 'Week 1', title: 'Vector Calculus & Electrostatics', description: 'Cover Unit I: Vector operations, coordinate transformations, electric field, potential, capacitance, boundary conditions.' },
      { week: 'Week 2', title: 'Magnetostatics & Maxwell\'s Equations', description: 'Cover Unit II & III: Biot-Savart, Ampere, Maxwell\'s equations, EM wave propagation, Poynting theorem, polarization.' },
      { week: 'Week 3', title: 'Transmission Lines & Smith Chart', description: 'Cover Unit IV: Transmission line equations, characteristic impedance, stubs, VSWR, Smith chart, single/double stub matching.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // BBA – 2nd SEMESTER
  // ─────────────────────────────────────────────────────────────────────
  {
    branch: 'BBA',
    semester: 2,
    subjectCode: 'BBA102',
    subjectName: 'Marketing Management',
    credits: 4,
    topics: [
      'Marketing Concepts & Philosophies',
      'Marketing Environment – Macro & Micro Factors',
      'Consumer Decision Making Process',
      'Market Segmentation, Targeting & Positioning',
      'Product Decisions & New Product Development',
      'Product Life Cycle & Branding',
      'Pricing Methods & Strategies',
      'Channels of Distribution & Channel Management',
      'Promotion Mix – Advertising, Personal Selling, PR',
      'Integrated Marketing Communication (IMC)',
      'Digital Marketing & Social Media Marketing',
      'Relationship Marketing & Green Marketing',
    ],
    insight:
      'Marketing is the most case-study oriented paper in Sem 2. Focus on the 4Ps framework thoroughly. IMC and Digital Marketing (Unit IV) are frequently tested in recent papers. Always link theory with real brand examples.',
    weakAreas: [
      'Integrated Marketing Communication (IMC)',
      'Product Life Cycle Strategies',
      'Channel Management Decisions',
    ],
    strengths: 'Basic Marketing Concepts & 4Ps',
    improvementPlan: [
      { title: 'Case Study on Market Segmentation', description: 'Analyze segmentation strategy of 2 Indian brands (e.g., Amul, Zomato). Identify targeting strategy and positioning statement used.' },
      { title: 'IMC Campaign Design', description: 'Design a simple IMC campaign for a product of your choice. Identify all promotion mix tools: advertising medium, PR angle, sales promotion offer, digital approach.' },
      { title: 'PLC Stage Analysis', description: 'Identify 5 real products at each stage of the Product Life Cycle. Explain the recommended strategy for each stage with brand examples.' },
    ],
    studyPlan: [
      { week: 'Week 1', title: 'Marketing Basics & Consumer Behaviour', description: 'Cover Unit I: Marketing concepts, environments, consumer decision process, STP (Segmentation, Targeting, Positioning).' },
      { week: 'Week 2', title: '4Ps – Product, Price, Place', description: 'Cover Units II & III: Product decisions, PLC, branding, pricing strategies, distribution channels, channel management.' },
      { week: 'Week 3', title: 'Promotion & Emerging Trends', description: 'Cover Unit IV: Promotion mix, IMC approach, Digital Marketing, Green Marketing, Social Media. Do 3 case studies.' },
    ],
  },

  {
    branch: 'BBA',
    semester: 2,
    subjectCode: 'BBA104',
    subjectName: 'Decision Techniques for Business',
    credits: 4,
    topics: [
      'Statistics – Frequency Distribution & Graphic Presentation',
      'Measures of Central Tendency – Mean, Median, Mode',
      'Measures of Variation – SD, IQR, Normal Distribution',
      'Correlation Coefficient – Pearson & Spearman',
      'Regression – OLS Method & Regression Lines',
      'Linear Programming – Formulation & Graphical Method',
      'Simplex Method & Duality',
      'Transportation Problem – Initial Solution Methods',
      'Assignment Problem – Hungarian Method',
      'Travelling Salesman Model',
    ],
    insight:
      'This subject is quantitative – every mark counts through numerical accuracy. Statistics (Unit I) and LP (Unit III) are the heaviest weighted units. Spearman\'s rank correlation is very commonly asked.',
    weakAreas: [
      'Simplex Method Iterations',
      'Hungarian Assignment Method',
      'Spearman Rank Correlation Computation',
    ],
    strengths: 'Descriptive Statistics & Mean/Median',
    improvementPlan: [
      { title: 'Solve 10 Correlation & Regression Problems', description: 'Use Karl Pearson\'s formula and Spearman\'s rank formula for data sets. Cross-verify using the regression line equation.' },
      { title: 'LP Graphical Method Practice', description: 'Solve 5 LP problems graphically identifying feasible region, corner points, and optimal solution. Include both maximization and minimization.' },
      { title: 'Hungarian Method Mastery', description: 'Practice the 5-step Hungarian algorithm on at least 6 assignment problems (3x3, 4x4) including unbalanced and restricted assignments.' },
    ],
    studyPlan: [
      { week: 'Week 1', title: 'Statistics & Probability Fundamentals', description: 'Cover Unit I: frequency distributions, graphs, central tendency, dispersion measures, and normal distribution curve.' },
      { week: 'Week 2', title: 'Correlation, Regression & Linear Programming', description: 'Cover Units II & III: Pearson & Spearman correlation, regression lines, LP formulation, graphical & Simplex methods.' },
      { week: 'Week 3', title: 'Transportation & Assignment Problems', description: 'Cover Unit IV: Transportation initial solutions (NWCM, VAM), MODI method, Assignment Hungarian method, TSP.' },
    ],
  },

  {
    branch: 'BBA',
    semester: 2,
    subjectCode: 'BBA106',
    subjectName: 'Human Resource Management',
    credits: 4,
    topics: [
      'HRM Functions & Roles of HR Manager',
      'Workforce Diversity & Work-Life Balance',
      'Human Resource Information System (HRIS)',
      'Human Resource Planning – Quantitative & Qualitative',
      'Job Analysis – Job Description & Specification',
      'Recruitment Sources & Selection Process',
      'Training & Development Techniques',
      'Management Development Programmes',
      'Performance Appraisal – Methods & Process',
      'Compensation Management & Pay Bands',
      'HR Audit & Contemporary HR Issues',
    ],
    insight:
      'HRM is a conceptual paper heavily based on definitions and frameworks. Focus on the HR planning cycle and appraisal methods. Case study based questions require you to apply theories to real workplace scenarios.',
    weakAreas: [
      'Performance Appraisal Methods (MBO, 360-degree)',
      'Compensation Structures & Incentive Plans',
      'Training Program Design',
    ],
    strengths: 'HRM Concepts & Recruitment Process',
    improvementPlan: [
      { title: 'Map the HRM Cycle', description: 'Draw a complete HRM cycle from HR Planning → Recruitment → Selection → Training → Appraisal → Compensation. Explain each step with definitions.' },
      { title: 'Compare Appraisal Methods', description: 'Create a table comparing Rating Scale, MBO, 360-degree, and Behaviorally Anchored methods with advantages and disadvantages.' },
      { title: 'Training Method Classification', description: 'Categorize training methods as On-the-job (Job Rotation, Apprenticeship) vs Off-the-job (Case Study, Role Playing). Give 2 examples of each.' },
    ],
    studyPlan: [
      { week: 'Week 1', title: 'HRM Introduction & HR Planning', description: 'Cover Units I & II: HRM functions, challenges, HRIS, HR planning, job analysis, job description, recruitment and selection.' },
      { week: 'Week 2', title: 'Training & Development', description: 'Cover Unit III: Types of training (apprenticeship, vestibule, job rotation), management development, cultural shock, outsourcing.' },
      { week: 'Week 3', title: 'Performance Appraisal & Compensation', description: 'Cover Unit IV: Appraisal methods, counselling, job changes, compensation policies, incentive plans, HR Audit.' },
    ],
  },

  {
    branch: 'BBA',
    semester: 2,
    subjectCode: 'BBA108',
    subjectName: 'Business Communication',
    credits: 2,
    topics: [
      'Process of Communication & 7Cs of Communication',
      'Effective Listening & Spoken English Improvement',
      'Multicultural Communication & Globalization Impact',
      'Cross-Cultural Communication Barriers',
      'Business Letter Types – Persuasive, Request, Sales, Complaints',
      'Employment Letters – Interview, Resignation, Promotion',
      'Departmental Communication – Notice, Agenda, Minutes',
      'Project & Report Writing',
      'Presentation Tools & Guidelines',
    ],
    insight:
      'Business Communication is NUES – your teacher evaluates throughout the semester. Presentation skills and letter writing are your main assessments. The multicultural communication section often has MCQ-based questions in internal tests.',
    weakAreas: [
      'Formal Report Writing Structure',
      'Cross-Cultural Communication Nuances',
      'Presentation Delivery Skills',
    ],
    strengths: 'Business Letter Writing & 7Cs',
    improvementPlan: [
      { title: 'Write 5 Different Business Letters', description: 'Practice one each of: Sales Letter, Complaint Letter, Job Application, Resignation Letter, and Circular. Focus on correct format and tone.' },
      { title: 'Prepare a 5-Minute Presentation', description: 'Choose any business topic and create a 7-slide PowerPoint using presentation guidelines. Practice delivering it in under 5 minutes.' },
      { title: 'Meeting Documentation Practice', description: 'Draft a Notice, Agenda, and Minutes for a mock committee meeting. Ensure all required elements (date, attendees, decisions) are included.' },
    ],
    studyPlan: [
      { week: 'Week 1', title: 'Communication Fundamentals & Multicultural Comm', description: 'Cover Units I & II: 7Cs, communication process, effective listening, globalization, cross-cultural barriers.' },
      { week: 'Week 2', title: 'Business Letter Writing', description: 'Cover Unit III: All types of business letters, employment letters, persuasive communication. Write 3 practice letters.' },
      { week: 'Week 3', title: 'Departmental Comm & Presentations', description: 'Cover Unit IV: Notice, Memorandum, Agenda, Minutes, Report writing, and presentation skills. Deliver 1 practice presentation.' },
    ],
  },

  {
    branch: 'BBA',
    semester: 2,
    subjectCode: 'BBA112',
    subjectName: 'E-Commerce',
    credits: 2,
    topics: [
      'E-Commerce Meaning, Types & Models (B2B, B2C, C2C)',
      'Challenges & Barriers in E-Commerce',
      'E-Commerce in India & Transition Challenges',
      'Digital Payment Systems & e-Money',
      'Electronic Fund Transfer (EFT)',
      'E-Commerce Security Environment',
      'Encryption, Decryption & Digital Signatures',
      'E-Commerce Applications in Various Industries',
      'Mobile Commerce (M-Commerce)',
      'Emerging Trends – AI in E-Commerce, Social Commerce',
      'Ethical & Regulatory Considerations',
    ],
    insight:
      'E-Commerce is a scoring subject if you memorize definitions and can give real-world examples. Unit II (payment systems) and Unit III (security) are high-value exam sections. Relate everything to Indian e-commerce platforms.',
    weakAreas: [
      'Encryption Techniques & Digital Security',
      'Electronic Payment System Types',
      'Regulatory Framework in E-Commerce',
    ],
    strengths: 'E-Commerce Models & Basic Concepts',
    improvementPlan: [
      { title: 'Map Indian E-Commerce Landscape', description: 'Analyze 3 Indian e-commerce companies (Flipkart, Meesho, Amazon India) and categorize their business model. Identify their payment and security approaches.' },
      { title: 'Digital Payment Deep Dive', description: 'List all 5 types of electronic payment systems. Explain UPI, Digital Wallets, and Credit/Debit cards with advantages and risks of each.' },
      { title: 'Security Measures Study', description: 'Understand SSL/TLS, digital signatures, two-factor authentication, and firewall as e-commerce security measures. Create a mind map.' },
    ],
    studyPlan: [
      { week: 'Week 1', title: 'E-Commerce Introduction & Indian Context', description: 'Cover Unit I: E-commerce types (B2B, B2C, C2C, G2C), models, advantages, challenges, Indian e-commerce readiness.' },
      { week: 'Week 2', title: 'Payment Systems & Security', description: 'Cover Units II & III: Digital payment systems, EFT, e-money, security threats, encryption, digital certificates.' },
      { week: 'Week 3', title: 'Applications & Emerging Trends', description: 'Cover Unit IV: Industry-specific e-commerce applications, M-Commerce, AI in e-commerce, regulatory and ethical issues.' },
    ],
  },

  {
    branch: 'BBA',
    semester: 2,
    subjectCode: 'BBA118',
    subjectName: 'Indian Knowledge Systems',
    credits: 2,
    topics: [
      'Vedic Tradition & Classical Indian Darshanas',
      'Indian Culture – Evolution & Distinctive Features',
      'Indian Music, Dance & Cultural Heritage',
      'Arthashastra by Kautilya – Introduction',
      'Traditional Knowledge Digital Library (TKDL)',
      'Geographical Indications of Goods',
      'Concept of Maya (Advaita Vedanta)',
      'Dharma – Varna, Ashram, Svadharma',
      'Karma – Corporate Karma & Business Ethics',
      'Vasudhaiva Kutumbakam',
      'Indian Mathematics, Astronomy & Engineering',
      'Vastu Shastra & Shilpa Shastra',
    ],
    insight:
      'IKS is a memory-oriented subject with philosophical depth. Focus on key Sanskrit terms with their precise definitions and business management parallels. Kautilya\'s Arthashastra business applications are frequently asked.',
    weakAreas: [
      'Connecting IKS Concepts to Modern Management',
      'Vedic Darshanas & Philosophical Distinctions',
      'Vastu Shastra Technical Details',
    ],
    strengths: 'Karma & Dharma Concept Understanding',
    improvementPlan: [
      { title: 'Create an IKS Concept Map', description: 'Draw a mind map connecting Dharma → Management ethics, Karma → Corporate accountability, Vasudhaiva Kutumbakam → CSR & sustainability.' },
      { title: 'Study Kautilya\'s Arthashastra', description: 'Summarize 5 key management principles from Arthashastra. Compare them with modern management theories (e.g., Kautilya vs. Porter on strategy).' },
      { title: 'Memorize 10 Key Sanskrit Terms', description: 'Create flashcards for: Maya, Dharma, Karma, Moksha, Artha, Kama, Vasudhaiva Kutumbakam, Svadharma, Ahimsa, Satya. Include definitions + business application.' },
    ],
    studyPlan: [
      { week: 'Week 1', title: 'Indian Philosophy & Culture', description: 'Cover Unit I: Vedic tradition, Darshanas, Indian culture evolution, music and dance as cultural expression.' },
      { week: 'Week 2', title: 'IKS in Commerce & Spirituality', description: 'Cover Units II & III: Arthashastra, TKDL, Geographical Indications, Maya, Dharma, Karma, Vasudhaiva Kutumbakam.' },
      { week: 'Week 3', title: 'Science & Technology in IKS', description: 'Cover Unit IV: Indian Mathematics, Astronomy, Metals and Metalworking, Vastu Shastra, Shilpa Shastra. Link to modern engineering.' },
    ],
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  let inserted = 0;
  let updated = 0;

  for (const rec of recommendations) {
    const filter = {
      branch: rec.branch,
      semester: rec.semester,
      subjectCode: rec.subjectCode,
    };

    const result = await SyllabusRecommendation.updateOne(
      filter,
      { $set: rec },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log(`  ➕ Inserted: [${rec.branch} Sem ${rec.semester}] ${rec.subjectCode} – ${rec.subjectName}`);
      inserted++;
    } else {
      console.log(`  ♻️  Updated: [${rec.branch} Sem ${rec.semester}] ${rec.subjectCode} – ${rec.subjectName}`);
      updated++;
    }
  }

  console.log(`\n✅ Seeding complete — ${inserted} inserted, ${updated} updated.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
