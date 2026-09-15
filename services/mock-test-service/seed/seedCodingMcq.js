require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Question = require('../models/Question');

// MCQ conversions of the 18 problems that used to be real, run-against-Judge0 coding
// questions (array/string/stack/linked-list/tree/recursion, 3 each) - see README for
// why real code execution was dropped. Each one still tests the same concept as the
// original problem, just via output-tracing, approach-correctness, or a snippet
// comparison instead of writing and running code. Every output/answer below has been
// traced/computed by hand, since these feed real server-side scoring, and
// correctOptionIndex is deliberately spread across all four positions rather than
// always sitting at 0.
const QUESTIONS = [
  // ---------------- ARRAY ----------------
  {
    category: 'coding',
    questionText:
      'What is the time complexity of the optimal (Kadane\'s algorithm) solution for finding the maximum sum of a contiguous subarray in an array of n integers, compared to the brute-force approach?',
    options: [
      'O(log n) — using binary search',
      'O(n^2) — same as brute force, no improvement possible',
      'O(n) — a single pass tracking the best running sum, vs O(n^2) or O(n^3) brute force',
      'O(n log n) — using sort',
    ],
    correctOptionIndex: 2,
    difficulty: 'medium',
  },
  {
    category: 'coding',
    questionText:
      'An array may contain duplicate values. Which approach correctly finds the second largest DISTINCT value (not just the second element after sorting)?',
    options: [
      'Sort the array descending and return the element at index 1',
      'Return the maximum of the array after removing only the first occurrence of the maximum value',
      'Sort the array ascending and return the element at index n-2',
      'Track two variables (largest, secondLargest) in one pass, only updating secondLargest when a value is strictly less than largest and strictly greater than secondLargest',
    ],
    correctOptionIndex: 3,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText:
      "What will this code output?\n\nfunction rotateLeft(arr, k) {\n  const n = arr.length;\n  k = k % n;\n  return arr.slice(k).concat(arr.slice(0, k));\n}\nconsole.log(rotateLeft([1, 2, 3, 4, 5], 2));",
    options: ['[ 4, 5, 1, 2, 3 ]', '[ 3, 4, 5, 1, 2 ]', '[ 1, 2, 3, 4, 5 ]', '[ 2, 3, 4, 5, 1 ]'],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },

  // ---------------- STRING ----------------
  {
    category: 'coding',
    questionText:
      "What will this code output?\n\nconst s = \"A man a plan a canal Panama\";\nconst clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');\nconsole.log(clean === clean.split('').reverse().join(''));",
    options: ['false', "TypeError: clean.reverse is not a function", 'true', 'undefined'],
    correctOptionIndex: 2,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText:
      "What will this code output?\n\nconst s = \"swiss\";\nconst count = {};\nfor (const c of s) count[c] = (count[c] || 0) + 1;\nlet result;\nfor (const c of s) {\n  if (count[c] === 1) { result = c; break; }\n}\nconsole.log(result);",
    options: ["'s'", "'i'", 'undefined', "'w'"],
    correctOptionIndex: 3,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText: 'Which of these correctly counts the number of vowels (a, e, i, o, u) in a string s, case-insensitively?',
    options: [
      "return (s.toLowerCase().match(/[aeiou]/g) || []).length;",
      "return (s.match(/[aeiou]/g) || []).length;",
      "return s.split('').filter(c => 'aeiou'.includes(c)).length;",
      "return s.replace(/[^aeiouAEIOU]/g, '').length / 2;",
    ],
    correctOptionIndex: 0,
    difficulty: 'easy',
  },

  // ---------------- STACK ----------------
  {
    category: 'coding',
    questionText:
      "Which data structure naturally fits checking whether a string's brackets ( ) [ ] { } are validly matched and nested, and why?",
    options: [
      'A Queue — process brackets in the order they arrived (FIFO)',
      'A Stack — push opening brackets, and on a closing bracket check that it matches the top of the stack (LIFO mirrors how nesting must close in reverse order)',
      'A HashMap counting how many of each bracket type appear',
      "A single counter incremented on '(' and decremented on ')'",
    ],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText:
      'Using a monotonic stack, what is the time complexity of finding the Next Greater Element for every element in an array of n integers, compared to the naive nested-loop approach?',
    options: [
      'O(n log n) with a monotonic stack, vs O(n^2) naively',
      "O(n^2) either way — a monotonic stack doesn't help here",
      'O(1) with a monotonic stack — it looks up results directly',
      'O(n) with a monotonic stack, vs O(n^2) naively — each element is pushed and popped from the stack at most once',
    ],
    correctOptionIndex: 3,
    difficulty: 'medium',
  },
  {
    category: 'coding',
    questionText:
      "What will this code output?\n\nconst tokens = ['2', '3', '1', '*', '+', '9', '-'];\nconst stack = [];\nfor (const t of tokens) {\n  if (!isNaN(t)) stack.push(Number(t));\n  else {\n    const b = stack.pop();\n    const a = stack.pop();\n    stack.push(t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : a / b);\n  }\n}\nconsole.log(stack[0]);",
    options: ['-4', '4', '-14', '14'],
    correctOptionIndex: 0,
    difficulty: 'medium',
  },

  // ---------------- LINKED LIST (represented as an array over stdin, same as before) ----------------
  {
    category: 'coding',
    questionText: 'What will this code output?\n\nconst arr = [1, 2, 3, 4, 5];\nconsole.log(arr.reverse());',
    options: ['[ 1, 2, 3, 4, 5 ]', '[ 4, 3, 2, 1, 5 ]', '[ 5, 4, 3, 2, 1 ]', 'undefined'],
    correctOptionIndex: 2,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText:
      'Given an ALREADY SORTED array, what is the most efficient correct way to remove duplicate values while preserving order?',
    options: [
      "Insert every element into a Set, then sort the Set's contents again — O(n log n)",
      'A single forward pass comparing each element to the previous one, keeping it only if different — O(n)',
      'Compare every pair of elements with a nested loop — O(n^2)',
      'Sort the array again first, then do the single forward pass — O(n log n)',
    ],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText:
      "What will this code output?\n\nfunction middle(arr) {\n  let slow = 0, fast = 0;\n  while (fast < arr.length - 1) {\n    slow++;\n    fast += 2;\n  }\n  return arr[slow];\n}\nconsole.log(middle([1, 2, 3, 4, 5, 6]));",
    options: ['3', '5', '6', '4'],
    correctOptionIndex: 3,
    difficulty: 'easy',
  },

  // ---------------- TREE (complete binary tree, given as level-order array/size) ----------------
  {
    category: 'coding',
    questionText:
      'A complete binary tree has n nodes, filled level by level from left to right. What is its height (number of edges on the longest root-to-leaf path), in terms of n?',
    options: ['floor(log2(n))', 'n / 2', 'log2(n + 1)', 'sqrt(n)'],
    correctOptionIndex: 0,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText:
      "What will this code output?\n\nfunction deepestLevelSum(arr) {\n  const n = arr.length;\n  let h = 0;\n  while (Math.pow(2, h + 1) - 1 <= n - 1) h++;\n  const start = Math.pow(2, h) - 1;\n  return arr.slice(start).reduce((a, b) => a + b, 0);\n}\nconsole.log(deepestLevelSum([1, 2, 3, 4, 5, 6, 7]));",
    options: ['15', '7', '22', '28'],
    correctOptionIndex: 2,
    difficulty: 'medium',
  },
  {
    category: 'coding',
    questionText:
      'A complete binary tree with n = 10 nodes has floor(n/2) internal (non-leaf) nodes. How many leaf nodes does it have?',
    options: ['4', '5', '6', '3'],
    correctOptionIndex: 1,
    difficulty: 'easy',
  },

  // ---------------- RECURSION ----------------
  {
    category: 'coding',
    questionText:
      'What will this code output?\n\nfunction fact(n) {\n  if (n <= 1) return 1;\n  return n * fact(n - 1);\n}\nconsole.log(fact(5));',
    options: ['24', '60', '720', '120'],
    correctOptionIndex: 3,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText:
      'A naive recursive implementation of fib(n) = fib(n-1) + fib(n-2) (no memoization) has which time complexity, and how is it typically improved?',
    options: [
      'O(2^n); improved to O(n) using memoization to cache repeated subcalls',
      'O(n); already optimal as written',
      'O(n^2); improved to O(n log n) by sorting the call order',
      'O(log n); cannot be improved further',
    ],
    correctOptionIndex: 0,
    difficulty: 'easy',
  },
  {
    category: 'coding',
    questionText:
      'What will this code output?\n\nfunction sumDigits(n) {\n  if (n === 0) return 0;\n  return (n % 10) + sumDigits(Math.floor(n / 10));\n}\nconsole.log(sumDigits(12345));',
    options: ['51', '120', '15', '5'],
    correctOptionIndex: 2,
    difficulty: 'easy',
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
  console.error('Failed to seed coding MCQ questions:', err);
  process.exit(1);
});
