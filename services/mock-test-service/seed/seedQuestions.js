require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Question = require('../models/Question');

// 50 questions (10 per category). Every correctOptionIndex below has been worked out
// by hand and double-checked - these are used for real server-side scoring, so a
// wrong answer key here would silently make every test attempt against it wrong.
const QUESTIONS = [
  // ---- Aptitude ----
  {
    category: 'aptitude',
    questionText: 'A train travels 60 km in 45 minutes. What is its speed in km/h?',
    options: ['60', '80', '90', '75'],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },
  {
    category: 'aptitude',
    questionText:
      'A shopkeeper marks up an item by 25% and then gives a 20% discount on the marked price. What is the net profit or loss?',
    options: ['No profit no loss', '10% profit', '5% profit', '5% loss'],
    correctOptionIndex: 0,
    difficulty: 'medium',
  },
  {
    category: 'aptitude',
    questionText: 'What is 15% of 240?',
    options: ['36', '32', '40', '30'],
    correctOptionIndex: 0,
    difficulty: 'easy',
  },
  {
    category: 'aptitude',
    questionText:
      'The average of 5 numbers is 20. If one number is removed, the average of the remaining 4 becomes 18. What was the removed number?',
    options: ['28', '26', '30', '24'],
    correctOptionIndex: 0,
    difficulty: 'medium',
  },
  {
    category: 'aptitude',
    questionText: 'A can finish a job in 10 days, B in 15 days. Working together, how many days will they take?',
    options: ['6 days', '5 days', '8 days', '7 days'],
    correctOptionIndex: 0,
    difficulty: 'medium',
  },
  {
    category: 'aptitude',
    questionText: 'The ratio of two numbers is 3:5 and their sum is 96. What is the larger number?',
    options: ['60', '54', '64', '50'],
    correctOptionIndex: 0,
    difficulty: 'medium',
  },
  {
    category: 'aptitude',
    questionText: 'If the cost price of an item is Rs 500 and it is sold for Rs 650, what is the profit percentage?',
    options: ['20%', '25%', '30%', '35%'],
    correctOptionIndex: 2,
    difficulty: 'easy',
  },
  {
    category: 'aptitude',
    questionText: 'A sum of money doubles itself in 8 years at simple interest. What is the rate of interest per annum?',
    options: ['10%', '12.5%', '15%', '8%'],
    correctOptionIndex: 1,
    difficulty: 'medium',
  },
  {
    category: 'aptitude',
    questionText:
      'Two pipes A and B can fill a tank in 20 and 30 minutes respectively. If both are opened together, how long will they take to fill the tank?',
    options: ['10 minutes', '12 minutes', '15 minutes', '18 minutes'],
    correctOptionIndex: 1,
    difficulty: 'hard',
  },
  {
    category: 'aptitude',
    questionText: 'What is the compound interest on Rs 10,000 at 10% per annum for 2 years?',
    options: ['Rs 2,000', 'Rs 2,100', 'Rs 2,200', 'Rs 1,900'],
    correctOptionIndex: 1,
    difficulty: 'medium',
  },

  // ---- Coding ----
  {
    category: 'coding',
    questionText: 'What is the time complexity of binary search on a sorted array?',
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText: 'Which data structure follows LIFO (Last In, First Out) order?',
    options: ['Queue', 'Stack', 'Array', 'Linked List'],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText: "In JavaScript, what does the === operator check that == does not?",
    options: ['Value only', 'Type and value', 'Reference only', 'Nothing different'],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText: 'What is the worst-case time complexity of QuickSort?',
    options: ['O(n log n)', 'O(n)', 'O(n^2)', 'O(log n)'],
    correctOptionIndex: 2,
    difficulty: 'medium',
  },
  {
    category: 'coding',
    questionText: 'Which HTTP method is both idempotent and safe, typically used to retrieve data without side effects?',
    options: ['POST', 'GET', 'DELETE', 'PATCH'],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText: "What does SQL's GROUP BY clause do?",
    options: [
      'Sorts rows',
      'Filters rows before aggregation',
      'Groups rows sharing a value so aggregate functions can be applied per group',
      'Removes duplicate rows',
    ],
    correctOptionIndex: 2,
    difficulty: 'medium',
  },
  {
    category: 'coding',
    questionText: 'Which sorting algorithm has the best average-case time complexity among these?',
    options: ['Bubble Sort', 'Merge Sort', 'Selection Sort', 'Insertion Sort'],
    correctOptionIndex: 1,
    difficulty: 'medium',
  },
  {
    category: 'coding',
    questionText: 'In Python, which of these data types is immutable?',
    options: ['List', 'Dictionary', 'Tuple', 'Set'],
    correctOptionIndex: 2,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText: 'What does `typeof null` return in JavaScript?',
    options: ["'null'", "'undefined'", "'object'", "'number'"],
    correctOptionIndex: 2,
    difficulty: 'medium',
  },

  // ---- Reasoning ----
  {
    category: 'reasoning',
    questionText: 'Find the odd one out:',
    options: ['Apple', 'Banana', 'Carrot', 'Mango'],
    correctOptionIndex: 2,
    difficulty: 'easy',
  },
  {
    category: 'reasoning',
    questionText: 'If all Bloops are Razzies, and all Razzies are Lazzies, are all Bloops definitely Lazzies?',
    options: ['Yes', 'No', 'Cannot be determined', 'Only some Bloops'],
    correctOptionIndex: 0,
    difficulty: 'easy',
  },
  {
    category: 'reasoning',
    questionText: 'Complete the series: 2, 6, 12, 20, 30, ?',
    options: ['42', '40', '36', '44'],
    correctOptionIndex: 0,
    difficulty: 'medium',
  },
  {
    category: 'reasoning',
    questionText: "A is B's father. B is C's brother. How is A related to C?",
    options: ['Father', 'Grandfather', 'Uncle', 'Brother'],
    correctOptionIndex: 0,
    difficulty: 'medium',
  },
  {
    category: 'reasoning',
    questionText: 'Which number should replace the question mark? 3, 9, 27, 81, ?',
    options: ['162', '243', '216', '270'],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },
  {
    category: 'reasoning',
    questionText: "If 'CAT' is coded as '3120' (A=1, B=2, ... Z=26, digits concatenated), how is 'DOG' coded?",
    options: ['4157', '4177', '4257', '4159'],
    correctOptionIndex: 0,
    difficulty: 'hard',
  },
  {
    category: 'reasoning',
    questionText: 'Complete the series: 1, 4, 9, 16, 25, ?',
    options: ['30', '36', '32', '49'],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },
  {
    category: 'reasoning',
    questionText:
      "Pointing to a photograph, a man says, \"She is the daughter of my grandfather's only son.\" How is the woman related to the man?",
    options: ['Sister', 'Daughter', 'Mother', 'Cousin'],
    correctOptionIndex: 0,
    difficulty: 'hard',
  },
  {
    category: 'reasoning',
    questionText:
      "In a certain code, 'LISTEN' is written as 'MJTUFO' (each letter shifted forward by one). How is 'SILENT' written in that code?",
    options: ['TJMFOU', 'TJNFOU', 'SJMFOU', 'TKMFOU'],
    correctOptionIndex: 0,
    difficulty: 'medium',
  },
  {
    category: 'reasoning',
    questionText: 'A is taller than B. C is shorter than A but taller than B. Who is the tallest?',
    options: ['A', 'B', 'C', 'Cannot be determined'],
    correctOptionIndex: 0,
    difficulty: 'easy',
  },

  // ---- Web Development ----
  {
    category: 'web-development',
    questionText: "Which CSS property controls the space between an element's border and its content?",
    options: ['Margin', 'Padding', 'Border', 'Outline'],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },
  {
    category: 'web-development',
    questionText: 'Which HTML tag is used to define an internal style sheet within a document?',
    options: ['<css>', '<script>', '<style>', '<link>'],
    correctOptionIndex: 2,
    difficulty: 'easy',
  },
  {
    category: 'web-development',
    questionText: 'What does the acronym DOM stand for?',
    options: [
      'Document Object Model',
      'Data Object Management',
      'Digital Ordinance Model',
      'Document Oriented Markup',
    ],
    correctOptionIndex: 0,
    difficulty: 'easy',
  },
  {
    category: 'web-development',
    questionText: 'Which HTTP status code indicates a successful GET request?',
    options: ['404', '500', '200', '301'],
    correctOptionIndex: 2,
    difficulty: 'easy',
  },
  {
    category: 'web-development',
    questionText: 'In CSS Flexbox, which property aligns items along the main axis?',
    options: ['align-items', 'justify-content', 'flex-direction', 'align-content'],
    correctOptionIndex: 1,
    difficulty: 'medium',
  },
  {
    category: 'web-development',
    questionText: 'What does CORS stand for?',
    options: [
      'Cross-Origin Resource Sharing',
      'Client Origin Request Security',
      'Cross-Object Rendering System',
      'Common Origin Resource Standard',
    ],
    correctOptionIndex: 0,
    difficulty: 'medium',
  },
  {
    category: 'web-development',
    questionText: 'Which JavaScript method converts a JSON string into a JavaScript object?',
    options: ['JSON.stringify()', 'JSON.parse()', 'JSON.toObject()', 'Object.fromJSON()'],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },
  {
    category: 'web-development',
    questionText: 'In React, which hook is used to perform side effects in a functional component?',
    options: ['useState', 'useEffect', 'useMemo', 'useRef'],
    correctOptionIndex: 1,
    difficulty: 'medium',
  },
  {
    category: 'web-development',
    questionText: "Which CSS unit is relative to the root element's font-size?",
    options: ['em', 'rem', 'vh', '%'],
    correctOptionIndex: 1,
    difficulty: 'medium',
  },
  {
    category: 'web-development',
    questionText: 'What is the main purpose of the "alt" attribute on an <img> tag?',
    options: [
      'Sets image alignment',
      'Provides alternative text for accessibility and broken images',
      'Sets image animation',
      'Loads the image asynchronously',
    ],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },

  // ---- Backend ----
  {
    category: 'backend',
    questionText: 'In Express.js, what three parameters does a standard middleware function typically receive?',
    options: ['req, res, next', 'error, data, callback', 'request, response, error', 'next, req, res'],
    correctOptionIndex: 0,
    difficulty: 'easy',
  },
  {
    category: 'backend',
    questionText: 'What is the primary purpose of a load balancer?',
    options: [
      'Encrypt network traffic',
      'Distribute incoming requests across multiple servers',
      'Compress database records',
      'Cache static assets',
    ],
    correctOptionIndex: 1,
    difficulty: 'medium',
  },
  {
    category: 'backend',
    questionText: 'In REST API design, which HTTP method is typically used to partially update a resource?',
    options: ['GET', 'PUT', 'PATCH', 'DELETE'],
    correctOptionIndex: 2,
    difficulty: 'medium',
  },
  {
    category: 'backend',
    questionText: 'What does ORM stand for in the context of backend development?',
    options: [
      'Object-Relational Mapping',
      'Online Resource Management',
      'Ordered Record Model',
      'Operational Runtime Middleware',
    ],
    correctOptionIndex: 0,
    difficulty: 'easy',
  },
  {
    category: 'backend',
    questionText: 'Which of the following is a NoSQL database?',
    options: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'],
    correctOptionIndex: 2,
    difficulty: 'easy',
  },
  {
    category: 'backend',
    questionText: 'What is the purpose of an environment variable like `process.env.PORT` in a Node.js server?',
    options: [
      'Store the compiled code',
      'Configure runtime values without hardcoding them',
      'Encrypt passwords',
      'Cache API responses',
    ],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },
  {
    category: 'backend',
    questionText: 'In JWT-based authentication, where is the token typically sent on subsequent requests?',
    options: ['In the URL path', 'In the Authorization header', 'In a hidden form field', 'In the page title'],
    correctOptionIndex: 1,
    difficulty: 'medium',
  },
  {
    category: 'backend',
    questionText: 'What does it mean for an HTTP method to be "idempotent"?',
    options: [
      'It always returns JSON',
      'Making the same request multiple times has the same effect as making it once',
      'It requires authentication',
      'It only works over HTTPS',
    ],
    correctOptionIndex: 1,
    difficulty: 'hard',
  },
  {
    category: 'backend',
    questionText: 'Which status code should a server return when a client sends invalid request data?',
    options: ['200', '401', '400', '500'],
    correctOptionIndex: 2,
    difficulty: 'easy',
  },
  {
    category: 'backend',
    questionText: 'What is the main benefit of connection pooling in a database-backed server?',
    options: [
      'Encrypts queries',
      'Reuses existing connections instead of opening a new one per request',
      'Automatically backs up data',
      'Converts SQL to NoSQL',
    ],
    correctOptionIndex: 1,
    difficulty: 'medium',
  },
];

const run = async () => {
  await connectDB();

  for (const q of QUESTIONS) {
    const existing = await Question.findOne({ questionText: q.questionText });
    if (existing) {
      console.log(`Already exists, skipping: "${q.questionText.slice(0, 40)}..."`);
      continue;
    }
    await Question.create(q);
    console.log(`Created [${q.category}]: "${q.questionText.slice(0, 50)}..."`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to seed questions:', err);
  process.exit(1);
});
