require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Question = require('../models/Question');
const Result = require('../models/Result');

const seedData = async () => {
  try {
    await connectDB();
    console.log('Clearing existing database records...');

    await User.deleteMany();
    await Category.deleteMany();
    await Question.deleteMany();
    await Result.deleteMany();

    console.log('Creating Admin and Demo Users...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@quizsystem.com',
      phone: '+1 800 555 0199',
      password: 'AdminPassword123!',
      role: 'admin',
      isActive: true
    });

    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 555 0101',
      password: 'UserPassword123!',
      role: 'user',
      isActive: true
    });

    const user2 = await User.create({
      name: 'Sarah Smith',
      email: 'sarah@example.com',
      phone: '+1 555 0102',
      password: 'UserPassword123!',
      role: 'user',
      isActive: true
    });

    const user3 = await User.create({
      name: 'Alex Kumar',
      email: 'alex@example.com',
      phone: '+1 555 0103',
      password: 'UserPassword123!',
      role: 'user',
      isActive: true
    });

    console.log('Creating Categories...');
    const categoriesData = [
      {
        categoryName: 'General Knowledge',
        description: 'Explore diverse questions spanning world geography, literature, culture, and notable historical events.',
        difficulty: 'easy',
        icon: 'bi-globe-americas',
        isActive: true
      },
      {
        categoryName: 'Computer Science',
        description: 'Master core CS fundamentals, algorithms, operating systems, networking, and memory architectures.',
        difficulty: 'medium',
        icon: 'bi-cpu',
        isActive: true
      },
      {
        categoryName: 'Mathematics',
        description: 'Sharpen your analytical skills with algebra, calculus, logic puzzles, probability, and geometry.',
        difficulty: 'hard',
        icon: 'bi-calculator',
        isActive: true
      },
      {
        categoryName: 'Science',
        description: 'Discover the laws of physics, chemical reactions, molecular biology, astronomy, and earth sciences.',
        difficulty: 'medium',
        icon: 'bi-radioactive',
        isActive: true
      },
      {
        categoryName: 'English',
        description: 'Test your vocabulary, English grammar, reading comprehension, idioms, and linguistic fluency.',
        difficulty: 'easy',
        icon: 'bi-book-half',
        isActive: true
      },
      {
        categoryName: 'Programming',
        description: 'Evaluate your knowledge in modern JavaScript, Python, asynchronous event loops, and clean code principles.',
        difficulty: 'medium',
        icon: 'bi-code-slash',
        isActive: true
      },
      {
        categoryName: 'History',
        description: 'Journey through ancient civilizations, medieval empires, world wars, and modern geopolitical movements.',
        difficulty: 'medium',
        icon: 'bi-hourglass-split',
        isActive: true
      },
      {
        categoryName: 'Technology',
        description: 'Stay ahead with the latest advancements in artificial intelligence, cloud architectures, and cybersecurity.',
        difficulty: 'hard',
        icon: 'bi-robot',
        isActive: true
      }
    ];

    const createdCategories = await Category.insertMany(categoriesData);
    const catMap = {};
    createdCategories.forEach(c => {
      catMap[c.categoryName] = c._id;
    });

    console.log('Creating Comprehensive Questions...');
    const questionsData = [
      // Computer Science Questions
      {
        categoryId: catMap['Computer Science'],
        questionText: 'What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?',
        options: [
          { key: 'A', text: 'O(1)' },
          { key: 'B', text: 'O(log n)' },
          { key: 'C', text: 'O(n)' },
          { key: 'D', text: 'O(n log n)' }
        ],
        correctAnswer: 'B',
        explanation: 'In a balanced BST like an AVL or Red-Black tree, the tree height is logarithmic relative to the number of nodes, yielding O(log n) search time.',
        difficulty: 'medium',
        marks: 1
      },
      {
        categoryId: catMap['Computer Science'],
        questionText: 'Which protocol operates at the Transport layer of the OSI model and guarantees packet delivery?',
        options: [
          { key: 'A', text: 'UDP' },
          { key: 'B', text: 'IP' },
          { key: 'C', text: 'TCP' },
          { key: 'D', text: 'HTTP' }
        ],
        correctAnswer: 'C',
        explanation: 'TCP (Transmission Control Protocol) operates at Layer 4 (Transport layer) and provides connection-oriented, reliable byte stream delivery with acknowledgements.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['Computer Science'],
        questionText: 'What deadlock condition is eliminated by establishing a strict global ordering of all resource allocations?',
        options: [
          { key: 'A', text: 'Mutual Exclusion' },
          { key: 'B', text: 'Hold and Wait' },
          { key: 'C', text: 'No Preemption' },
          { key: 'D', text: 'Circular Wait' }
        ],
        correctAnswer: 'D',
        explanation: 'Imposing a linear or numerical order on resources ensures a process can only request resources in an increasing sequence, completely preventing circular wait.',
        difficulty: 'hard',
        marks: 2
      },
      {
        categoryId: catMap['Computer Science'],
        questionText: 'Which data structure follows the First-In, First-Out (FIFO) principle?',
        options: [
          { key: 'A', text: 'Stack' },
          { key: 'B', text: 'Queue' },
          { key: 'C', text: 'Binary Tree' },
          { key: 'D', text: 'Heap' }
        ],
        correctAnswer: 'B',
        explanation: 'A Queue adheres strictly to the First-In, First-Out (FIFO) access order.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['Computer Science'],
        questionText: 'Which scheduling algorithm may lead to starvation if short processes continuously arrive in the ready queue?',
        options: [
          { key: 'A', text: 'Round Robin (RR)' },
          { key: 'B', text: 'First-Come, First-Served (FCFS)' },
          { key: 'C', text: 'Shortest Job First (SJF / SRTF)' },
          { key: 'D', text: 'First-In, First-Out (FIFO)' }
        ],
        correctAnswer: 'C',
        explanation: 'Shortest Job First (SJF) always prioritizes shorter burst jobs. If new short jobs keep arriving, longer jobs can be starved indefinitely.',
        difficulty: 'medium',
        marks: 1
      },
      {
        categoryId: catMap['Computer Science'],
        questionText: 'What is the purpose of the Translation Lookaside Buffer (TLB) in modern computer architectures?',
        options: [
          { key: 'A', text: 'To cache page table translations from virtual to physical addresses' },
          { key: 'B', text: 'To store instructions before decoding in the instruction register' },
          { key: 'C', text: 'To resolve branch prediction misses' },
          { key: 'D', text: 'To synchronize multiple CPU cores across bus lines' }
        ],
        correctAnswer: 'A',
        explanation: 'The TLB is a dedicated hardware cache within the Memory Management Unit (MMU) that stores recent virtual-to-physical address mappings to speed up memory access.',
        difficulty: 'hard',
        marks: 2
      },
      {
        categoryId: catMap['Computer Science'],
        questionText: 'Which database normalization form eliminates transitive functional dependencies on the primary key?',
        options: [
          { key: 'A', text: 'First Normal Form (1NF)' },
          { key: 'B', text: 'Second Normal Form (2NF)' },
          { key: 'C', text: 'Third Normal Form (3NF)' },
          { key: 'D', text: 'Boyce-Codd Normal Form (BCNF)' }
        ],
        correctAnswer: 'C',
        explanation: 'A relation is in 3NF if it is in 2NF and has no non-prime attribute transitively dependent on any candidate key.',
        difficulty: 'medium',
        marks: 1
      },
      {
        categoryId: catMap['Computer Science'],
        questionText: 'Which graph traversal algorithm uses a First-In, First-Out (FIFO) queue and finds the shortest path on unweighted graphs?',
        options: [
          { key: 'A', text: 'Depth-First Search (DFS)' },
          { key: 'B', text: 'Breadth-First Search (BFS)' },
          { key: 'C', text: 'Topological Sort' },
          { key: 'D', text: 'Kruskal\'s Algorithm' }
        ],
        correctAnswer: 'B',
        explanation: 'Breadth-First Search explores vertices level by level using a queue, guaranteeing the shortest path in terms of edge count on unweighted graphs.',
        difficulty: 'easy',
        marks: 1
      },

      // Programming Questions
      {
        categoryId: catMap['Programming'],
        questionText: 'What will the expression `typeof null` evaluate to in JavaScript?',
        options: [
          { key: 'A', text: '"null"' },
          { key: 'B', text: '"undefined"' },
          { key: 'C', text: '"object"' },
          { key: 'D', text: '"boolean"' }
        ],
        correctAnswer: 'C',
        explanation: 'In JavaScript, typeof null returns "object", which is a well-known legacy quirk dating back to the first JavaScript implementation in 1995.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['Programming'],
        questionText: 'In Python, which built-in data type is immutable?',
        options: [
          { key: 'A', text: 'List' },
          { key: 'B', text: 'Dictionary' },
          { key: 'C', text: 'Set' },
          { key: 'D', text: 'Tuple' }
        ],
        correctAnswer: 'D',
        explanation: 'Tuples in Python cannot be modified, resized, or assigned to once created; they are immutable sequences.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['Programming'],
        questionText: 'Which JavaScript method creates a new array populated with the results of calling a provided function on every element in the calling array?',
        options: [
          { key: 'A', text: 'Array.prototype.forEach()' },
          { key: 'B', text: 'Array.prototype.map()' },
          { key: 'C', text: 'Array.prototype.filter()' },
          { key: 'D', text: 'Array.prototype.reduce()' }
        ],
        correctAnswer: 'B',
        explanation: 'map() transforms each item in an array without mutating the original array and returns a brand new array.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['Programming'],
        questionText: 'In the JavaScript event loop, which queue has higher execution priority: the Microtask queue or the Macrotask (Callback) queue?',
        options: [
          { key: 'A', text: 'Macrotask queue always runs first' },
          { key: 'B', text: 'Microtask queue runs before the next macrotask is processed' },
          { key: 'C', text: 'Both queues execute simultaneously across threads' },
          { key: 'D', text: 'Priority depends on the size of the call stack' }
        ],
        correctAnswer: 'B',
        explanation: 'All microtasks (such as Promise callbacks, queueMicrotask) are drained completely before the event loop advances to pick the next macrotask.',
        difficulty: 'hard',
        marks: 2
      },
      {
        categoryId: catMap['Programming'],
        questionText: 'What feature allows a nested function in JavaScript to retain access to variables from its outer lexical scope even after the outer function has returned?',
        options: [
          { key: 'A', text: 'Hoisting' },
          { key: 'B', text: 'Closure' },
          { key: 'C', text: 'Prototypal Inheritance' },
          { key: 'D', text: 'Strict Mode' }
        ],
        correctAnswer: 'B',
        explanation: 'A closure is the combination of a function bundled together with references to its surrounding lexical environment state.',
        difficulty: 'easy',
        marks: 1
      },

      // General Knowledge Questions
      {
        categoryId: catMap['General Knowledge'],
        questionText: 'Which is the largest and deepest ocean on planet Earth?',
        options: [
          { key: 'A', text: 'Atlantic Ocean' },
          { key: 'B', text: 'Indian Ocean' },
          { key: 'C', text: 'Pacific Ocean' },
          { key: 'D', text: 'Arctic Ocean' }
        ],
        correctAnswer: 'C',
        explanation: 'The Pacific Ocean is the largest and deepest of Earth oceanic divisions, spanning over 165 million square kilometers and containing the Mariana Trench.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['General Knowledge'],
        questionText: 'Who was the first person to walk on the surface of the Moon?',
        options: [
          { key: 'A', text: 'Buzz Aldrin' },
          { key: 'B', text: 'Neil Armstrong' },
          { key: 'C', text: 'Yuri Gagarin' },
          { key: 'D', text: 'Michael Collins' }
        ],
        correctAnswer: 'B',
        explanation: 'American astronaut Neil Armstrong was the first person to set foot on the Moon on July 20, 1969, during Apollo 11.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['General Knowledge'],
        questionText: 'What is the official federal capital city of Australia?',
        options: [
          { key: 'A', text: 'Sydney' },
          { key: 'B', text: 'Melbourne' },
          { key: 'C', text: 'Canberra' },
          { key: 'D', text: 'Brisbane' }
        ],
        correctAnswer: 'C',
        explanation: 'Canberra was chosen as the compromise capital of Australia in 1908 to resolve rivalry between Sydney and Melbourne.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['General Knowledge'],
        questionText: 'Who discovered penicillin in 1928, marking the dawn of the antibiotic era?',
        options: [
          { key: 'A', text: 'Louis Pasteur' },
          { key: 'B', text: 'Alexander Fleming' },
          { key: 'C', text: 'Edward Jenner' },
          { key: 'D', text: 'Robert Koch' }
        ],
        correctAnswer: 'B',
        explanation: 'Sir Alexander Fleming discovered penicillin produced by Penicillium notatum mold at St. Mary\'s Hospital in London.',
        difficulty: 'easy',
        marks: 1
      },

      // Mathematics Questions
      {
        categoryId: catMap['Mathematics'],
        questionText: 'What is the derivative of f(x) = 3x^2 + 5x - 7 with respect to x?',
        options: [
          { key: 'A', text: '6x + 5' },
          { key: 'B', text: '3x + 5' },
          { key: 'C', text: '6x^2 + 5' },
          { key: 'D', text: '6x - 7' }
        ],
        correctAnswer: 'A',
        explanation: 'Using the power rule: d/dx(3x^2) = 6x, d/dx(5x) = 5, and constant = 0. Thus, f\'(x) = 6x + 5.',
        difficulty: 'medium',
        marks: 1
      },
      {
        categoryId: catMap['Mathematics'],
        questionText: 'What is the sum of interior angles in an ordinary Euclidean hexagon (6-sided polygon)?',
        options: [
          { key: 'A', text: '360°' },
          { key: 'B', text: '540°' },
          { key: 'C', text: '720°' },
          { key: 'D', text: '900°' }
        ],
        correctAnswer: 'C',
        explanation: 'Formula: (n - 2) * 180°. For a hexagon (n = 6): (6 - 2) * 180° = 4 * 180° = 720°.',
        difficulty: 'medium',
        marks: 1
      },
      {
        categoryId: catMap['Mathematics'],
        questionText: 'What is the solution to the system of equations: 2x + y = 7 and x - y = 2?',
        options: [
          { key: 'A', text: 'x = 3, y = 1' },
          { key: 'B', text: 'x = 2, y = 3' },
          { key: 'C', text: 'x = 4, y = -1' },
          { key: 'D', text: 'x = 1, y = 5' }
        ],
        correctAnswer: 'A',
        explanation: 'Adding the two equations: 3x = 9 => x = 3. Then 3 - y = 2 => y = 1.',
        difficulty: 'easy',
        marks: 1
      },

      // Science Questions
      {
        categoryId: catMap['Science'],
        questionText: 'What is the chemical symbol for the element Gold?',
        options: [
          { key: 'A', text: 'Ag' },
          { key: 'B', text: 'Au' },
          { key: 'C', text: 'Gd' },
          { key: 'D', text: 'Fe' }
        ],
        correctAnswer: 'B',
        explanation: 'The symbol Au originates from the Latin name for gold, "aurum", meaning shining dawn.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['Science'],
        questionText: 'Which organelle is often referred to as the powerhouse of the eukaryotic cell?',
        options: [
          { key: 'A', text: 'Ribosome' },
          { key: 'B', text: 'Golgi Apparatus' },
          { key: 'C', text: 'Mitochondrion' },
          { key: 'D', text: 'Endoplasmic Reticulum' }
        ],
        correctAnswer: 'C',
        explanation: 'Mitochondria generate most of the chemical energy needed via cellular respiration (ATP synthesis).',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['Science'],
        questionText: 'Which nucleotide base in RNA replaces thymine found in DNA?',
        options: [
          { key: 'A', text: 'Adenine' },
          { key: 'B', text: 'Cytosine' },
          { key: 'C', text: 'Guanine' },
          { key: 'D', text: 'Uracil' }
        ],
        correctAnswer: 'D',
        explanation: 'In RNA molecules, Uracil (U) pairs with Adenine in place of Thymine (T).',
        difficulty: 'easy',
        marks: 1
      },

      // Technology Questions
      {
        categoryId: catMap['Technology'],
        questionText: 'What does the acronym "API" stand for in software engineering?',
        options: [
          { key: 'A', text: 'Application Programming Interface' },
          { key: 'B', text: 'Automated Processing Instruction' },
          { key: 'C', text: 'Applied Protocol Integration' },
          { key: 'D', text: 'Application Performance Index' }
        ],
        correctAnswer: 'A',
        explanation: 'An Application Programming Interface enables software systems to communicate using defined protocols.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['Technology'],
        questionText: 'In cloud computing service models, what category do Google Docs, Salesforce, and Microsoft Office 365 belong to?',
        options: [
          { key: 'A', text: 'IaaS (Infrastructure as a Service)' },
          { key: 'B', text: 'PaaS (Platform as a Service)' },
          { key: 'C', text: 'SaaS (Software as a Service)' },
          { key: 'D', text: 'BaaS (Backend as a Service)' }
        ],
        correctAnswer: 'C',
        explanation: 'SaaS delivers fully hosted applications over the internet to end users without requiring local software installation.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['Technology'],
        questionText: 'Which security vulnerability occurs when an application includes untrusted user input directly inside a database query without parameterized statements?',
        options: [
          { key: 'A', text: 'Cross-Site Scripting (XSS)' },
          { key: 'B', text: 'SQL Injection (SQLi)' },
          { key: 'C', text: 'Cross-Site Request Forgery (CSRF)' },
          { key: 'D', text: 'Man-in-the-Middle (MITM)' }
        ],
        correctAnswer: 'B',
        explanation: 'SQL Injection happens when user input alters SQL queries, allowing unauthorized database operations.',
        difficulty: 'easy',
        marks: 1
      },

      // History Questions
      {
        categoryId: catMap['History'],
        questionText: 'In which year did the Second World War officially end?',
        options: [
          { key: 'A', text: '1943' },
          { key: 'B', text: '1945' },
          { key: 'C', text: '1948' },
          { key: 'D', text: '1950' }
        ],
        correctAnswer: 'B',
        explanation: 'World War II formally ended in September 1945 with the unconditional surrender of Axis forces.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['History'],
        questionText: 'In which country did the Industrial Revolution begin in the mid-18th century?',
        options: [
          { key: 'A', text: 'France' },
          { key: 'B', text: 'Germany' },
          { key: 'C', text: 'Great Britain' },
          { key: 'D', text: 'United States' }
        ],
        correctAnswer: 'C',
        explanation: 'Great Britain was the birthplace of the Industrial Revolution due to coal deposits and steam engine innovations.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['History'],
        questionText: 'Which historic English charter signed in 1215 by King John established the principle that everyone, including the monarch, is subject to the law?',
        options: [
          { key: 'A', text: 'Habeas Corpus Act' },
          { key: 'B', text: 'Bill of Rights' },
          { key: 'C', text: 'Magna Carta' },
          { key: 'D', text: 'Treaty of Paris' }
        ],
        correctAnswer: 'C',
        explanation: 'Magna Carta was issued in June 1215 at Runnymede, establishing rule of law.',
        difficulty: 'medium',
        marks: 1
      },

      // English Questions
      {
        categoryId: catMap['English'],
        questionText: 'Identify the figure of speech used in: "The wind whispered through the dark pine trees."',
        options: [
          { key: 'A', text: 'Metaphor' },
          { key: 'B', text: 'Personification' },
          { key: 'C', text: 'Hyperbole' },
          { key: 'D', text: 'Simile' }
        ],
        correctAnswer: 'B',
        explanation: 'Personification attributes human qualities (such as whispering) to non-human entities.',
        difficulty: 'easy',
        marks: 1
      },
      {
        categoryId: catMap['English'],
        questionText: 'Select the correct sentence that follows standard English subject-verb agreement:',
        options: [
          { key: 'A', text: 'The list of items are on the desk.' },
          { key: 'B', text: 'The list of items is on the desk.' },
          { key: 'C', text: 'The list of items were on the desk.' },
          { key: 'D', text: 'The list of items being on the desk.' }
        ],
        correctAnswer: 'B',
        explanation: 'The singular subject "list" takes the singular verb "is".',
        difficulty: 'medium',
        marks: 1
      },
      {
        categoryId: catMap['English'],
        questionText: 'What does the popular English idiom "to bite the bullet" mean?',
        options: [
          { key: 'A', text: 'To act aggressively without warning' },
          { key: 'B', text: 'To face an unavoidable, difficult situation with courage' },
          { key: 'C', text: 'To make a critical mathematical error' },
          { key: 'D', text: 'To celebrate a sudden victory' }
        ],
        correctAnswer: 'B',
        explanation: '"To bite the bullet" means to face a grim or difficult situation that cannot be avoided.',
        difficulty: 'easy',
        marks: 1
      }
    ];

    await Question.insertMany(questionsData);
    console.log(`Seeded ${questionsData.length} questions across 8 categories.`);

    // Seed sample results for demo users to populate Leaderboard and Analytics charts
    console.log('Seeding demo quiz results for leaderboard and analytics...');
    const csCategory = createdCategories.find(c => c.categoryName === 'Computer Science');
    const progCategory = createdCategories.find(c => c.categoryName === 'Programming');
    const gkCategory = createdCategories.find(c => c.categoryName === 'General Knowledge');

    await Result.create([
      {
        userId: user1._id,
        categoryId: csCategory._id,
        totalQuestions: 4,
        correctAnswers: 4,
        wrongAnswers: 0,
        unanswered: 0,
        totalMarks: 5,
        obtainedMarks: 5,
        percentage: 100,
        timeTaken: 85,
        answers: [],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId: user1._id,
        categoryId: progCategory._id,
        totalQuestions: 4,
        correctAnswers: 3,
        wrongAnswers: 1,
        unanswered: 0,
        totalMarks: 4,
        obtainedMarks: 3,
        percentage: 75,
        timeTaken: 110,
        answers: [],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        userId: user2._id,
        categoryId: gkCategory._id,
        totalQuestions: 3,
        correctAnswers: 3,
        wrongAnswers: 0,
        unanswered: 0,
        totalMarks: 3,
        obtainedMarks: 3,
        percentage: 100,
        timeTaken: 45,
        answers: [],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        userId: user2._id,
        categoryId: csCategory._id,
        totalQuestions: 4,
        correctAnswers: 3,
        wrongAnswers: 1,
        unanswered: 0,
        totalMarks: 5,
        obtainedMarks: 4,
        percentage: 80,
        timeTaken: 130,
        answers: [],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        userId: user3._id,
        categoryId: progCategory._id,
        totalQuestions: 4,
        correctAnswers: 4,
        wrongAnswers: 0,
        unanswered: 0,
        totalMarks: 4,
        obtainedMarks: 4,
        percentage: 100,
        timeTaken: 72,
        answers: [],
        createdAt: new Date()
      }
    ]);

    console.log('✔ Database successfully seeded with sample data, admin, and demo users!');
    console.log('----------------------------------------------------');
    console.log('ADMIN LOGIN CREDENTIALS:');
    console.log('Email:    admin@quizsystem.com');
    console.log('Password: AdminPassword123!');
    console.log('----------------------------------------------------');
    console.log('DEMO USER LOGIN CREDENTIALS:');
    console.log('Email:    john@example.com');
    console.log('Password: UserPassword123!');
    console.log('----------------------------------------------------');

    if (require.main === module) {
      await disconnectDB();
      process.exit(0);
    }
    return true;
  } catch (err) {
    console.error('Seeding error:', err);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
