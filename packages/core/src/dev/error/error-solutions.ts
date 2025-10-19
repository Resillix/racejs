/**
 * @fileoverview ErrorSolutionEngine - Pattern-based solution finder
 *
 * Matches errors against a database of known patterns and provides
 * solution suggestions with code examples and helpful links.
 *
 * @module dev/error/error-solutions
 */

import type { Solution, SolutionPattern } from './types.js';

/**
 * Solution patterns database
 *
 * Each pattern matches common errors and provides helpful solutions
 */
const SOLUTION_PATTERNS: SolutionPattern[] = [
  // 1. Undefined property access
  {
    id: 'undefined-property',
    pattern: /Cannot read propert(?:y|ies) ['"](\w+)['"] of (undefined|null)/,
    errorType: ['TypeError'],
    title: 'Accessing Property of Undefined/Null',
    description: 'Trying to access a property on an undefined or null value.',
    solution: 'Use optional chaining (?.) or check if the object exists first.',
    codeExample: `// Before:
const value = obj.property;

// After (optional chaining):
const value = obj?.property;

// Or with explicit check:
if (obj && obj.property) {
  const value = obj.property;
}`,
    links: [
      {
        title: 'Optional Chaining - MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining',
        type: 'mdn',
      },
    ],
    confidence: 0.95,
  },

  // 1b. Modern Node.js undefined property access format
  {
    id: 'undefined-property-modern',
    pattern: /Cannot read propert(?:y|ies) of (undefined|null) \(reading ['"](\w+)['"]\)/,
    errorType: ['TypeError'],
    title: 'Accessing Property of Undefined/Null',
    description: 'Trying to access a property on an undefined or null value.',
    solution: 'Use optional chaining (?.) or check if the object exists first.',
    codeExample: `// Before:
const value = obj.property;

// After (optional chaining):
const value = obj?.property;

// Or with explicit check:
if (obj && obj.property) {
  const value = obj.property;
}`,
    links: [
      {
        title: 'Optional Chaining - MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining',
        type: 'mdn',
      },
    ],
    confidence: 0.95,
  },

  // 2. Undefined is not a function
  {
    id: 'undefined-function',
    pattern: /(\w+) is not a function/,
    errorType: ['TypeError'],
    title: 'Function Does Not Exist',
    description: 'Trying to call something that is not a function.',
    solution: 'Check if the function exists and is properly exported/imported.',
    codeExample: `// Common causes:
// 1. Typo in function name
// 2. Wrong import statement
// 3. Async function not awaited

// Check import:
import { myFunction } from './module';
console.log(typeof myFunction);  // Should be 'function'

// Check if function exists:
if (typeof myFunction === 'function') {
  myFunction();
}`,
    links: [
      {
        title: 'Import/Export - MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import',
        type: 'mdn',
      },
    ],
    confidence: 0.9,
  },

  // 3. Cannot find module
  {
    id: 'module-not-found',
    pattern: /Cannot find module '(.+)'/,
    errorType: ['Error'],
    title: 'Module Not Found',
    description: 'Node.js cannot find the specified module.',
    solution: 'Install the module using npm/yarn/pnpm or check the import path.',
    codeExample: `// If external package:
npm install <module-name>
# or
pnpm add <module-name>

// If local file, check path:
// Wrong: import x from './file'
// Right:  import x from './file.js'  (include extension for ESM)

// Check package.json for "type": "module"`,
    links: [
      {
        title: 'Node.js Modules - Docs',
        url: 'https://nodejs.org/api/modules.html',
        type: 'docs',
      },
    ],
    confidence: 0.98,
  },

  // 4. ENOENT file not found
  {
    id: 'file-not-found',
    pattern: /ENOENT: no such file or directory.*'(.+)'/,
    errorType: ['Error'],
    title: 'File Not Found',
    description: 'The file system cannot find the specified file.',
    solution: 'Check if the file exists and the path is correct.',
    codeExample: `import { existsSync, readFileSync } from 'fs';

// Check if file exists first:
const filePath = './data.json';
if (existsSync(filePath)) {
  const data = readFileSync(filePath, 'utf-8');
} else {
  console.error('File not found:', filePath);
}

// Or use try-catch:
try {
  const data = readFileSync(filePath, 'utf-8');
} catch (error) {
  console.error('Failed to read file:', error.message);
}`,
    links: [
      {
        title: 'File System - Node.js',
        url: 'https://nodejs.org/api/fs.html',
        type: 'docs',
      },
    ],
    confidence: 0.95,
  },

  // 5. EADDRINUSE port already in use
  {
    id: 'port-in-use',
    pattern: /EADDRINUSE.*:(\d+)/,
    errorType: ['Error'],
    title: 'Port Already in Use',
    description: 'Another process is already using this port.',
    solution: 'Stop the other process or use a different port.',
    codeExample: `// Find and kill process using port (Linux/Mac):
lsof -ti:3000 | xargs kill -9

// Or use environment variable for port:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

// Or find available port automatically:
import { createServer } from 'http';
const server = createServer(app);
server.listen(0); // Let OS assign available port
server.on('listening', () => {
  console.log('Server on port:', server.address().port);
});`,
    links: [
      {
        title: 'EADDRINUSE Error - Stack Overflow',
        url: 'https://stackoverflow.com/questions/4075287/node-express-eaddrinuse-address-already-in-use-kill-server',
        type: 'stackoverflow',
      },
    ],
    confidence: 1.0,
  },

  // 6. JSON parse error
  {
    id: 'json-parse-error',
    pattern: /Unexpected token .* in JSON at position/,
    errorType: ['SyntaxError'],
    title: 'Invalid JSON',
    description: 'The JSON string is malformed and cannot be parsed.',
    solution: 'Validate the JSON string before parsing or use try-catch.',
    codeExample: `// Use try-catch for JSON parsing:
try {
  const data = JSON.parse(jsonString);
} catch (error) {
  console.error('Invalid JSON:', error.message);
  // Provide default value or handle error
  const data = {};
}

// For API responses:
const response = await fetch('/api/data');
if (!response.ok) {
  throw new Error(\`HTTP error! status: \${response.status}\`);
}
const data = await response.json(); // Safe if response is OK`,
    links: [
      {
        title: 'JSON.parse() - MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse',
        type: 'mdn',
      },
    ],
    confidence: 0.9,
  },

  // 7. Async/await error
  {
    id: 'async-error',
    pattern: /await is only valid in async function/,
    errorType: ['SyntaxError'],
    title: 'Await Outside Async Function',
    description: 'Using await keyword outside of an async function.',
    solution: 'Wrap your code in an async function or use top-level await (Node.js 14.8+).',
    codeExample: `// Option 1: Wrap in async function
async function main() {
  const data = await fetchData();
  console.log(data);
}
main();

// Option 2: Top-level await (ESM only)
// In .mjs file or with "type": "module" in package.json
const data = await fetchData();
console.log(data);

// Option 3: Use .then() for promises
fetchData().then(data => {
  console.log(data);
});`,
    links: [
      {
        title: 'Async/Await - MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function',
        type: 'mdn',
      },
    ],
    confidence: 0.95,
  },

  // 8. Promise rejection unhandled
  {
    id: 'unhandled-promise',
    pattern: /UnhandledPromiseRejectionWarning/,
    errorType: ['Error'],
    title: 'Unhandled Promise Rejection',
    description: 'A Promise was rejected but no error handler was attached.',
    solution: 'Always add .catch() to promises or use try-catch with async/await.',
    codeExample: `// With async/await:
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error; // or return default value
  }
}

// With .then()/.catch():
fetchData()
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// Global handlers (last resort):
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});`,
    links: [
      {
        title: 'Promise Error Handling - MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#error_handling',
        type: 'mdn',
      },
    ],
    confidence: 0.92,
  },

  // 9. Variable not defined
  {
    id: 'variable-not-defined',
    pattern: /(\w+) is not defined/,
    errorType: ['ReferenceError'],
    title: 'Variable Not Defined',
    description: 'Trying to use a variable that has not been declared.',
    solution: 'Declare the variable or check for typos in the variable name.',
    codeExample: `// Make sure variable is declared:
let myVariable = 'value';
console.log(myVariable); // OK

// Check spelling:
const userName = 'John';
console.log(username); // Error! Should be userName

// For globals, access via globalThis:
console.log(globalThis.process); // Node.js process object

// Check if variable exists:
if (typeof myVariable !== 'undefined') {
  console.log(myVariable);
}`,
    links: [
      {
        title: 'ReferenceError - MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError',
        type: 'mdn',
      },
    ],
    confidence: 0.88,
  },

  // 10. Maximum call stack size exceeded
  {
    id: 'stack-overflow',
    pattern: /Maximum call stack size exceeded/,
    errorType: ['RangeError'],
    title: 'Stack Overflow (Infinite Recursion)',
    description: 'Function is calling itself too many times without terminating.',
    solution: 'Add a base case to stop recursion or use iteration instead.',
    codeExample: `// Problem: Missing base case
function countdown(n) {
  console.log(n);
  countdown(n - 1); // Infinite!
}

// Solution 1: Add base case
function countdown(n) {
  if (n <= 0) return; // Base case
  console.log(n);
  countdown(n - 1);
}

// Solution 2: Use iteration
function countdown(n) {
  while (n > 0) {
    console.log(n);
    n--;
  }
}

// Check for circular references:
const obj = {};
obj.self = obj; // Circular reference
// JSON.stringify(obj); // Error!
// Use JSON.stringify with replacer to handle this`,
    links: [
      {
        title: 'Recursion - MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Glossary/Recursion',
        type: 'mdn',
      },
    ],
    confidence: 0.9,
  },

  // 11. Cannot set property of undefined
  {
    id: 'set-property-undefined',
    pattern: /Cannot set propert(?:y|ies) '(\w+)' of (undefined|null)/,
    errorType: ['TypeError'],
    title: 'Setting Property on Undefined/Null',
    description: 'Trying to set a property on an undefined or null object.',
    solution: 'Initialize the object before setting properties.',
    codeExample: `// Problem:
let obj;
obj.name = 'John'; // Error!

// Solution 1: Initialize object
let obj = {};
obj.name = 'John'; // OK

// Solution 2: Check before setting
let obj;
if (!obj) {
  obj = {};
}
obj.name = 'John';

// Solution 3: Use nullish coalescing
let obj = existingObj ?? {};
obj.name = 'John';`,
    links: [
      {
        title: 'Nullish Coalescing - MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing',
        type: 'mdn',
      },
    ],
    confidence: 0.93,
  },

  // 12. ERR_HTTP_HEADERS_SENT
  {
    id: 'headers-sent',
    pattern: /Cannot set headers after they are sent/,
    errorType: ['Error'],
    title: 'Headers Already Sent',
    description: 'Trying to send response headers after response has already started.',
    solution: 'Ensure res.send()/res.json() is only called once per request.',
    codeExample: `// Problem: Multiple responses
app.get('/user', (req, res) => {
  res.json({ user: 'John' });
  res.json({ user: 'Jane' }); // Error!
});

// Solution: Return after sending
app.get('/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json({ user: req.user });
});

// With async/await:
app.get('/user', async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    res.json(user);
  } catch (error) {
    // Check if headers already sent
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});`,
    links: [
      {
        title: 'HTTP Response - Node.js',
        url: 'https://nodejs.org/api/http.html#responsewriteheadstatuscode-statusmessage-headers',
        type: 'docs',
      },
    ],
    confidence: 0.92,
  },
];

/**
 * Error solution engine
 *
 * Matches errors against known patterns and provides solutions.
 *
 * @example
 * ```typescript
 * const engine = new ErrorSolutionEngine();
 * const solutions = engine.find(new Error("Cannot read property 'x' of undefined"));
 * console.log(solutions[0].title); // "Accessing Property of Undefined/Null"
 * ```
 */
export class ErrorSolutionEngine {
  private patterns: SolutionPattern[];

  /**
   * Creates a new ErrorSolutionEngine
   *
   * @param customPatterns - Optional custom patterns to add
   */
  constructor(customPatterns: SolutionPattern[] = []) {
    this.patterns = [...SOLUTION_PATTERNS, ...customPatterns];
  }

  /**
   * Find solution suggestions for an error
   *
   * @param error - Error to find solutions for
   * @returns Array of matching solutions
   */
  find(error: Error): Solution[] {
    const solutions: Solution[] = [];

    for (const pattern of this.patterns) {
      if (this.matchPattern(error, pattern)) {
        const score = this.scoreMatch(error, pattern);

        const solution: Solution = {
          title: pattern.title,
          description: pattern.description,
          solution: pattern.solution,
          links: pattern.links || [],
          confidence: score,
        };

        if (pattern.codeExample) {
          solution.code = pattern.codeExample;
        }

        solutions.push(solution);
      }
    }

    // Sort by confidence score (highest first)
    solutions.sort((a, b) => b.confidence - a.confidence);

    return solutions;
  }

  /**
   * Check if error matches a pattern
   *
   * @param error - Error to match
   * @param pattern - Pattern to match against
   * @returns True if match found
   */
  private matchPattern(error: Error, pattern: SolutionPattern): boolean {
    // Check error type if specified
    if (pattern.errorType && pattern.errorType.length > 0) {
      if (!pattern.errorType.includes(error.name)) {
        return false;
      }
    }

    // Match pattern against error message
    if (pattern.pattern instanceof RegExp) {
      return pattern.pattern.test(error.message);
    } else {
      return error.message.includes(pattern.pattern);
    }
  }

  /**
   * Calculate confidence score for a match
   *
   * @param error - Error that matched
   * @param pattern - Pattern that matched
   * @returns Confidence score (0-1)
   */
  private scoreMatch(error: Error, pattern: SolutionPattern): number {
    let score = pattern.confidence;

    // Boost score if error type matches exactly
    if (pattern.errorType && pattern.errorType.includes(error.name)) {
      score = Math.min(1.0, score + 0.05);
    }

    // Boost score if pattern is regex (more specific)
    if (pattern.pattern instanceof RegExp) {
      score = Math.min(1.0, score + 0.03);
    }

    return score;
  }

  /**
   * Add a custom solution pattern
   *
   * @param pattern - Pattern to add
   */
  addPattern(pattern: SolutionPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Remove a pattern by ID
   *
   * @param id - Pattern ID
   */
  removePattern(id: string): void {
    this.patterns = this.patterns.filter((p) => p.id !== id);
  }

  /**
   * List all patterns
   *
   * @returns Array of patterns
   */
  listPatterns(): SolutionPattern[] {
    return [...this.patterns];
  }

  /**
   * Get pattern by ID
   *
   * @param id - Pattern ID
   * @returns Pattern or undefined
   */
  getPattern(id: string): SolutionPattern | undefined {
    return this.patterns.find((p) => p.id === id);
  }

  /**
   * Learn from feedback (placeholder for future ML integration)
   *
   * @param errorHash - Error hash
   * @param solutionId - Solution ID that was helpful/not helpful
   * @param helpful - Whether the solution was helpful
   */
  learnFromFeedback(errorHash: string, solutionId: string, helpful: boolean): void {
    // Placeholder for future machine learning integration
    // Could store feedback in database and adjust confidence scores
    console.log(
      `Feedback for ${errorHash}: ${solutionId} was ${helpful ? 'helpful' : 'not helpful'}`
    );
  }
}
