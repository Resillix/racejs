/**
 * Native RaceJS Example
 * 
 * This shows the same functionality as express-compatible.js
 * but using the native @racejs/core API for maximum performance.
 */

import { createApp } from '@racejs/core';

const app = createApp();

// ============================================
// MIDDLEWARE - Native RaceJS API
// ============================================

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ============================================
// ROUTING - Native RaceJS API
// ============================================

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'This is native RaceJS code - maximum performance!',
    framework: 'RaceJS native (@racejs/core)',
    performance: 'Maximum'
  });
});

// Route with parameters
app.get('/users/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'John Doe'
  });
});

// POST route with lazy body parsing
app.post('/users', async (req, res) => {
  // In native RaceJS, you explicitly parse when needed
  const body = await req.json();
  
  res.status(201).json({
    message: 'User created',
    user: body
  });
});

// Query parameters
app.get('/search', (req, res) => {
  res.json({
    query: req.query.q,
    page: req.query.page || 1
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.url
  });
});

// ============================================
// OPTIMIZATION & START
// ============================================

// Compile routes for optimal performance
app.compile();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n⚡ Native RaceJS app running at http://localhost:${PORT}`);
  console.log('\nOptimizations enabled:');
  console.log('  ✅ Routes compiled (O(k) lookup)');
  console.log('  ✅ Lazy body parsing');
  console.log('  ✅ Zero-cost middleware');
  console.log('  ✅ Maximum performance\n');
});
