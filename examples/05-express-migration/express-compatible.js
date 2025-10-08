/**
 * Express Migration Example
 * 
 * Side-by-side comparison of Express and RaceJS code.
 * Shows how to migrate from Express to RaceJS.
 * 
 * This file demonstrates the @racejs/compat package which provides
 * 100% Express 4.x compatibility.
 */

import express from '@racejs/compat'; // Drop-in Express replacement!

const app = express();

// ============================================
// MIDDLEWARE - Same as Express!
// ============================================

// Body parsing - works exactly like Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware - identical to Express
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ============================================
// ROUTING - Same as Express!
// ============================================

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'This is Express-compatible code running on RaceJS!',
    framework: 'RaceJS with @racejs/compat',
    compatible: true
  });
});

// Route with parameters
app.get('/users/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'John Doe'
  });
});

// POST route with body parsing
app.post('/users', (req, res) => {
  res.status(201).json({
    message: 'User created',
    user: req.body
  });
});

// Query parameters - works the same
app.get('/search', (req, res) => {
  res.json({
    query: req.query.q,
    page: req.query.page || 1
  });
});

// ============================================
// ERROR HANDLING - Same as Express!
// ============================================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.url
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// ============================================
// START SERVER - Same as Express!
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🏁 Express-compatible app running on RaceJS at http://localhost:${PORT}`);
  console.log('\nThis code is 100% Express-compatible, but 2-4× faster!');
  console.log('\nMigration steps:');
  console.log('  1. npm install @racejs/compat');
  console.log('  2. Change: import express from "express"');
  console.log('     To:     import express from "@racejs/compat"');
  console.log('  3. Done! No other changes needed.\n');
});
