/**
 * Example: Hot Reload with Live Monitoring
 *
 * This example shows detailed hot reload activity with real-time logging.
 * Perfect for understanding exactly what's happening during hot reload.
 */

const { createApp, hasParcelWatcher } = require('../../packages/core/dist/index.js');
const path = require('node:path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   RaceJS Hot Reload - Live Monitoring Example             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Create app with custom hot reload config
const app = createApp({
  hotReload: {
    enabled: true,
    roots: [__dirname],
    debounceMs: 50,
    batchMs: 100,
  }
});

console.log('📊 Configuration:');
console.log('   Backend:', hasParcelWatcher() ? '🚀 @parcel/watcher' : '📁 fs.watch');
console.log('   Watch directory:', __dirname);
console.log('   Debounce:', '50ms');
console.log('   Batch window:', '100ms');
console.log('   Environment:', process.env.NODE_ENV || 'development');
console.log('');

// Counter to track reloads
let requestCount = 0;
let reloadCount = 0;

// Define routes with version tracking
app.get('/status', (req, res) => {
  requestCount++;
  res.json({
    status: 'running',
    backend: hasParcelWatcher() ? '@parcel/watcher' : 'fs.watch',
    stats: {
      totalRequests: requestCount,
      totalReloads: reloadCount,
      uptime: process.uptime(),
    },
    hotReload: {
      enabled: true,
      watching: __dirname,
    },
    version: 1, // ⬅️ Change this to trigger hot reload!
    timestamp: new Date().toISOString(),
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'This is a test endpoint',
    tip: 'Edit this message and watch it reload!',
    version: 1, // ⬅️ Change this too!
  });
});

app.get('/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Alice', role: 'Admin' },
      { id: 2, name: 'Bob', role: 'User' },
      { id: 3, name: 'Charlie', role: 'Guest' }
    ],
    version: 1,
  });
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    healthy: true,
    reloads: reloadCount,
  });
});

// Compile routes
app.compile();

const PORT = 3000;

// Start server
app.listen(PORT, () => {
  console.log('\n✅ Server started successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Endpoints:');
  console.log('   GET /status  - Detailed status with reload stats');
  console.log('   GET /test    - Simple test endpoint');
  console.log('   GET /users   - User list');
  console.log('   GET /health  - Health check');
  console.log('');
  console.log('🧪 Test Hot Reload:');
  console.log('   1. curl http://localhost:3000/status');
  console.log('   2. Edit this file - change any "version: 1" to "version: 2"');
  console.log('   3. Save and watch the logs below 👇');
  console.log('   4. curl http://localhost:3000/status again');
  console.log('   5. Notice version changed with ZERO downtime!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n👀 Monitoring file changes...\n');
});

// Enhanced logging for hot reload events
// Note: These are automatically handled by the built-in hot reload system
// The logs are shown by the Application class

// Simulate activity logging
setInterval(() => {
  // This just keeps the process alive and shows we're still running
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📊 Final Stats:');
  console.log(`   Total requests: ${requestCount}`);
  console.log(`   Total reloads: ${reloadCount}`);
  console.log('   Uptime:', Math.floor(process.uptime()), 'seconds');
  console.log('\n👋 Shutting down gracefully...\n');
  process.exit(0);
});
