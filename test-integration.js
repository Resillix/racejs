/**
 * Integration test - simple server test
 */

import { createApp } from './packages/core/dist/index.js';
import http from 'http';

console.log('=== Testing High-Performance Express Core ===\n');

// Test 1: Create app
console.log('✓ Test 1: Creating app...');
const app = createApp();
console.log('  ✓ App created successfully\n');

// Test 2: Register routes
console.log('✓ Test 2: Registering routes...');

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.get('/user/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

app.post('/data', (req, res) => {
  res.json({ received: true });
});

console.log('  ✓ Routes registered\n');

// Test 3: Check routes
console.log('✓ Test 3: Checking routes...');
const routes = app.getRoutes();
console.log(`  ✓ Found ${routes.length} routes:`);
routes.forEach(r => {
  console.log(`    - ${r.method} ${r.path} (${r.handlerCount} handler)`);
});
console.log();

// Test 4: Compile routes
console.log('✓ Test 4: Compiling routes...');
app.compile();
console.log('  ✓ Routes compiled successfully\n');

// Test 5: Start server
console.log('✓ Test 5: Starting server...');
const server = app.listen(3999, () => {
  console.log('  ✓ Server running on http://localhost:3999\n');

  // Test 6: Make requests
  testRequests();
});

async function testRequests() {
  console.log('✓ Test 6: Testing HTTP requests...');

  try {
    // Test GET /ping
    const ping = await makeRequest('/ping');
    console.log(`  ✓ GET /ping: ${ping}`);

    // Test GET /user/:id
    const user = await makeRequest('/user/123');
    console.log(`  ✓ GET /user/123: ${user}`);

    // Test POST /data
    const data = await makeRequest('/data', 'POST', '{"test": true}');
    console.log(`  ✓ POST /data: ${data}`);

    console.log('\n=== All Tests Passed! ===\n');
  } catch (err) {
    console.error('\n✗ Test failed:', err.message);
    process.exit(1);
  }

  // Cleanup
  server.close();
  process.exit(0);
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3999,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });

    req.on('error', reject);

    if (data) {
      req.write(data);
    }

    req.end();
  });
}
