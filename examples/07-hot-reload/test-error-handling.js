/**
 * Test script to demonstrate improved error handling
 *
 * This will intentionally create files with errors to show
 * how hot reload now displays detailed error information
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const testFile = path.join(routesDir, 'error-test.js');

console.log('\n🧪 Hot Reload Error Handling Test\n');
console.log('This test will create a file with syntax errors to demonstrate');
console.log('how errors are now displayed in the terminal.\n');

// Test 1: Syntax Error
console.log('Test 1: Creating file with syntax error...');
const syntaxErrorCode = `
// This file has a syntax error (missing closing brace)
module.exports = (app) => {
  app.get('/error-test', (req, res) => {
    res.json({ message: 'This will fail' })
  }
  // Missing closing brace here!
`;

fs.writeFileSync(testFile, syntaxErrorCode);
console.log('✓ File created. Watch the terminal for detailed error output!\n');

setTimeout(() => {
  console.log('\nTest 2: Creating file with runtime error...');
  const runtimeErrorCode = `
// This file has a runtime error
module.exports = (app) => {
  app.get('/error-test', (req, res) => {
    // This will cause a ReferenceError
    const data = undefinedVariable.toString();
    res.json({ data });
  });
};
`;

  fs.writeFileSync(testFile, runtimeErrorCode);
  console.log('✓ File created. Watch the terminal!\n');
}, 3000);

setTimeout(() => {
  console.log('\nTest 3: Creating valid file...');
  const validCode = `
// This file is valid
module.exports = (app) => {
  app.get('/error-test', (req, res) => {
    res.json({
      message: 'Error handling test complete!',
      status: 'success'
    });
  });
};
`;

  fs.writeFileSync(testFile, validCode);
  console.log('✓ Valid file created. Should reload successfully!\n');

  setTimeout(() => {
    // Cleanup
    console.log('\nCleaning up test file...');
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
      console.log('✓ Test file removed\n');
    }
  }, 2000);
}, 6000);
