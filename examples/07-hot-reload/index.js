/**
 * Example: Built-in Hot Reload
 *
 * Demonstrates RaceJS's professional built-in hot reload system.
 * No manual setup required - just create your app!
 *
 * Hot reload is automatically enabled in development (NODE_ENV !== 'production')
 * and watches common directories (routes/, src/routes/, api/, etc.)
 */

const { createApp, hasParcelWatcher } = require('../../packages/core/dist/index.js');

// Create app - hot reload is automatically enabled in development!
// Zero configuration needed - it just works! 🎉
const app = createApp({
  devMode: {
    enabled: true,
    verbose: true,
    devtools: true,
    recorder: true,
    profiler: true,
  },
});

// Log hot reload backend info
console.log('\n🔍 Hot Reload Backend Detection:');
console.log(
  '   @parcel/watcher available:',
  hasParcelWatcher() ? '✅ Yes' : '❌ No (using fs.watch fallback)'
);
console.log(
  '   Backend:',
  hasParcelWatcher() ? '🚀 @parcel/watcher (native, fast)' : '📁 fs.watch (Node.js built-in)'
);

// Define routes directly
app.get('/users', (req, res) => {
  res.json({
    success: true,
    message: 'Users endpoint - try editing this message!',
    data: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
    version: 1, // Change this to see hot reload!
    timestamp: new Date().toISOString(),
  });
});

app.get('/products', (req, res) => {
  res.json({
    success: true,
    message: 'Products endpoint',
    data: [
      { id: 1, name: 'Laptop', price: 999 },
      { id: 2, name: 'Phone', price: 699 },
    ],
    version: 1,
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    hotReload: process.env.NODE_ENV !== 'production' ? 'enabled ✅' : 'disabled',
    message: 'Built-in hot reload is active!',
  });
});

// Compile and start
app.compile();

const PORT = 3000;
const startTime = Date.now();

app.listen(PORT, () => {
  console.log('\n🏁 RaceJS Server Started!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`⚡️ Startup time: ${Date.now() - startTime}ms`);
  console.log('\n📝 Available Endpoints:');
  console.log('   GET  /health   - Health check & hot reload status');
  console.log('   GET  /users    - List users (with version tracking)');
  console.log('   GET  /products - List products');
  console.log('\n🔥 Hot Reload Active!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 Try this:');
  console.log('   1. In another terminal: curl http://localhost:3000/users');
  console.log('   2. Edit this file: change "version: 1" to "version: 2"');
  console.log('   3. Save the file');
  console.log('   4. Watch console for reload messages 👇');
  console.log('   5. Curl again to see version: 2.1 - zero downtime!');
  console.log('\n👀 Watching for file changes...\n');
});
