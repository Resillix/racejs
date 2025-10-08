/**
 * Hello World - Basic RaceJS Example
 * 
 * This is the simplest possible RaceJS application.
 * Perfect for getting started!
 */

import { createApp } from '@racejs/core';

const app = createApp();

// Simple route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello from RaceJS!',
    framework: 'RaceJS',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Compile routes for optimal performance
app.compile();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🏁 RaceJS server running at http://localhost:${PORT}`);
  console.log(`   GET / - Hello message`);
  console.log(`   GET /health - Health check`);
});
