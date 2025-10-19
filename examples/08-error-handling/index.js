/**
 * Phase 5: Error Handler & Aggregation Example
 *
 * This example demonstrates:
 * - Beautiful error pages with source code context
 * - Error aggregation and grouping
 * - Solution suggestions for common errors
 * - DevTools real-time error tracking
 * - Error trends and spike detection
 */

import { createApp } from '../../packages/core/dist/index.js';

const app = createApp({
  devMode: {
    enabled: true,
    recorder: true,
    devtools: true,
    logger: true,
  },
});

const PORT = 3000;

// ============================================================================
// Demo Routes - Various Error Types
// ============================================================================

/**
 * Route 1: TypeError - undefined property access
 * This is a common error that our solution engine can help with
 */
app.get('/error/undefined', (req, res) => {
  console.log('[ROUTE] /error/undefined hit');
  const user = null;
  console.log('[ROUTE] About to access user.name (should throw)');
  console.log(user.name); // Will throw: Cannot read properties of null
  res.send('This will never execute');
});

/**
 * Route 2: ReferenceError - undefined variable
 */
app.get('/error/reference', (req, res) => {
  console.log(nonExistentVariable); // ReferenceError
  res.send('This will never execute');
});

/**
 * Route 3: SyntaxError - JSON parse error
 */
app.get('/error/json', (req, res) => {
  const invalidJson = '{ invalid json }';
  JSON.parse(invalidJson); // SyntaxError
  res.send('This will never execute');
});

/**
 * Route 4: Custom error with helpful message
 */
app.get('/error/custom', (req, res) => {
  throw new Error('User authentication failed: Invalid token provided');
});

/**
 * Route 5: Async error
 */
app.get('/error/async', async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  throw new Error('Async operation failed: Database connection timeout');
});

/**
 * Route 6: File system error (ENOENT)
 */
app.get('/error/file', (req, res) => {
  const fs = require('fs');
  fs.readFileSync('/nonexistent/file.txt'); // ENOENT error
  res.send('This will never execute');
});

/**
 * Route 7: Type coercion error
 */
app.get('/error/type', (req, res) => {
  const num = 42;
  num.toUpperCase(); // TypeError: num.toUpperCase is not a function
  res.send('This will never execute');
});

/**
 * Route 8: Range error
 */
app.get('/error/range', (req, res) => {
  const arr = new Array(-1); // RangeError: Invalid array length
  res.send('This will never execute');
});

/**
 * Route 9: Recursive error (causes stack overflow)
 */
app.get('/error/recursion', (req, res) => {
  function infiniteRecursion() {
    infiniteRecursion();
  }
  infiniteRecursion();
  res.send('This will never execute');
});

/**
 * Route 10: Error with detailed context
 */
app.get('/error/context', (req, res) => {
  const orders = [
    { id: 1, total: 100 },
    { id: 2, total: 200 },
    { id: 3, total: null },
  ];

  // Process orders - will fail on the third one
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + order.total.toFixed(2); // Error on null
  }, 0);

  res.json({ totalRevenue });
});

/**
 * Route 11: Duplicate error (test error aggregation)
 * Call this multiple times to see error counting and trend detection
 */
app.get('/error/duplicate', (req, res) => {
  const config = null;
  const port = config.port; // Same error will be grouped together
  res.send('This will never execute');
});

/**
 * Route 12: Intermittent error (randomly fails)
 * Good for testing error spike detection
 */
app.get('/error/intermittent', (req, res) => {
  if (Math.random() > 0.7) {
    throw new Error('Intermittent service failure: External API timeout');
  }
  res.json({ status: 'success', timestamp: Date.now() });
});

// ============================================================================
// Working Routes
// ============================================================================

/**
 * Home page with instructions
 */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>RaceJS Error Handling Demo</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 1200px;
          margin: 50px auto;
          padding: 0 20px;
          line-height: 1.6;
          background: #0f0f0f;
          color: #e0e0e0;
        }
        h1 {
          color: #0066ff;
          border-bottom: 3px solid #0066ff;
          padding-bottom: 10px;
        }
        h2 {
          color: #00c851;
          margin-top: 30px;
        }
        .error-link {
          display: inline-block;
          padding: 12px 20px;
          margin: 8px;
          background: #ff4444;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .error-link:hover {
          background: #cc0000;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 68, 68, 0.4);
        }
        .devtools-link {
          display: inline-block;
          padding: 15px 30px;
          margin: 20px 0;
          background: #0066ff;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1.1em;
          transition: all 0.2s;
        }
        .devtools-link:hover {
          background: #0052cc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.4);
        }
        .info-box {
          background: #1a1a1a;
          border-left: 4px solid #0066ff;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .feature-list {
          background: #1a1a1a;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .feature-list li {
          margin: 10px 0;
          color: #e0e0e0;
        }
        code {
          background: #2d2d2d;
          padding: 2px 6px;
          border-radius: 3px;
          color: #00c851;
          font-family: 'Monaco', monospace;
        }
      </style>
    </head>
    <body>
      <h1>⚡ RaceJS Phase 5: Error Handler & Aggregation</h1>

      <div class="info-box">
        <p><strong>🎯 Purpose:</strong> This example demonstrates RaceJS's advanced error handling capabilities including beautiful error pages, error aggregation, solution suggestions, and real-time DevTools tracking.</p>
      </div>

      <h2>🚀 Quick Start</h2>
      <ol>
        <li>Click any error link below to see the beautiful error page</li>
        <li>Open DevTools to see real-time error tracking</li>
        <li>Click the same error multiple times to see aggregation</li>
        <li>Try the intermittent error multiple times to trigger spike detection</li>
      </ol>

      <a href="http://localhost:9229" class="devtools-link" target="_blank">
        📊 Open DevTools Dashboard → Errors Tab
      </a>

      <p style="margin-top: 10px; color: #888;">
        <small>Note: DevTools runs on a separate port (9229) from the main app (3000)</small>
      </p>

      <h2>🚨 Error Demonstration Links</h2>

      <h3>Basic Errors</h3>
      <a href="/error/undefined" class="error-link">TypeError: Undefined Property</a>
      <a href="/error/reference" class="error-link">ReferenceError</a>
      <a href="/error/json" class="error-link">JSON Parse Error</a>
      <a href="/error/custom" class="error-link">Custom Error</a>

      <h3>Advanced Errors</h3>
      <a href="/error/async" class="error-link">Async Error</a>
      <a href="/error/file" class="error-link">File System Error</a>
      <a href="/error/type" class="error-link">Type Coercion Error</a>
      <a href="/error/range" class="error-link">Range Error</a>

      <h3>Special Cases</h3>
      <a href="/error/context" class="error-link">Error with Context</a>
      <a href="/error/duplicate" class="error-link">Duplicate Error (Test Aggregation)</a>
      <a href="/error/intermittent" class="error-link">Intermittent Error (Test Spike Detection)</a>
      <a href="/error/recursion" class="error-link">⚠️ Stack Overflow (Careful!)</a>

      <h2>✨ Features Demonstrated</h2>
      <div class="feature-list">
        <ul>
          <li><strong>Beautiful Error Pages:</strong> See source code context with ±10 lines around the error</li>
          <li><strong>Solution Suggestions:</strong> Get AI-powered suggestions for fixing common errors</li>
          <li><strong>Error Aggregation:</strong> Duplicate errors are grouped with occurrence counts</li>
          <li><strong>Trend Detection:</strong> See if errors are increasing, decreasing, or stable</li>
          <li><strong>Spike Alerts:</strong> Get notified when error rates spike (10x increase)</li>
          <li><strong>Stack Trace Analysis:</strong> Full stack traces with file paths and line numbers</li>
          <li><strong>Real-time DevTools:</strong> WebSocket-based live error tracking</li>
          <li><strong>Error Management:</strong> Mark errors as resolved or ignored</li>
          <li><strong>Export Functionality:</strong> Export errors in JSON or CSV format</li>
          <li><strong>Filter & Search:</strong> Filter by status, severity, or search terms</li>
        </ul>
      </div>

      <h2>📖 What to Look For</h2>
      <div class="info-box">
        <h3>Error Page Features:</h3>
        <ul>
          <li>🎨 4-tab interface: Source Code, Stack Trace, Solutions, Request</li>
          <li>📝 Syntax-highlighted source code with error line highlighted</li>
          <li>💡 Solution suggestions with confidence scores</li>
          <li>🔗 Editor links (VS Code, WebStorm, Sublime)</li>
          <li>📋 Copy error button</li>
          <li>🔄 Retry request button</li>
        </ul>

        <h3>DevTools Errors Tab:</h3>
        <ul>
          <li>📊 Statistics: Total, Unique, Error Rate, Critical count</li>
          <li>🔍 Filters: Status, Severity, Search</li>
          <li>📈 Trend indicators: ↗️ Increasing, ↘️ Decreasing, → Stable</li>
          <li>🎨 Severity badges: Critical (red), High (orange), Medium (yellow), Low (green)</li>
          <li>👁️ Click any error to see details panel</li>
          <li>✅ Mark as Resolved/Ignored</li>
          <li>💾 Export to JSON/CSV</li>
        </ul>
      </div>

      <h2>🧪 Testing Guide</h2>
      <div class="info-box">
        <h3>Test Error Aggregation:</h3>
        <ol>
          <li>Click "Duplicate Error" 5-10 times</li>
          <li>Open DevTools → Errors tab</li>
          <li>Notice the count increases but only 1 error entry exists</li>
          <li>Check the trend indicator (should show ↗️ increasing)</li>
        </ol>

        <h3>Test Spike Detection:</h3>
        <ol>
          <li>Click "Intermittent Error" 20-30 times rapidly</li>
          <li>Watch for spike alert notification in DevTools</li>
          <li>Alert triggers when current rate > 10x average rate</li>
        </ol>

        <h3>Test Error Management:</h3>
        <ol>
          <li>Generate a few different errors</li>
          <li>In DevTools, click on an error to view details</li>
          <li>Click "Resolve" or "Ignore" button</li>
          <li>Notice the status badge updates</li>
          <li>Use filters to show only Open/Resolved/Ignored errors</li>
        </ol>
      </div>

      <h2>🎯 Advanced Usage</h2>
      <div class="info-box">
        <p><strong>Custom Error Notifications:</strong></p>
        <p>The error handler supports multiple notification channels:</p>
        <ul>
          <li><code>Console</code> - Pretty console output (default)</li>
          <li><code>Webhook</code> - Generic HTTP webhooks</li>
          <li><code>Slack</code> - Slack channel notifications</li>
          <li><code>Email</code> - Email notifications (configure in app)</li>
        </ul>

        <p><strong>Solution Patterns:</strong></p>
        <p>The error handler includes 50+ solution patterns for common errors including:</p>
        <ul>
          <li>Undefined property access</li>
          <li>Module not found</li>
          <li>File system errors (ENOENT, EACCES)</li>
          <li>Port already in use (EADDRINUSE)</li>
          <li>Type errors and coercion</li>
          <li>JSON parse errors</li>
          <li>Database connection errors</li>
          <li>And many more...</li>
        </ul>
      </div>

      <h2>💻 Code Example</h2>
      <div class="info-box">
        <p>Here's how simple it is to use RaceJS error handling:</p>
        <pre><code>import { createApp } from '@racejs/core';

const app = createApp({
  dev: {
    enabled: true,
    recorder: true,
    devtools: true,
  },
});

// Errors are automatically caught and handled beautifully!
app.get('/user/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  res.json(user); // If error occurs, you get a beautiful error page
});</code></pre>
      </div>

      <p style="margin-top: 50px; text-align: center; color: #666;">
        Built with ⚡ <a href="https://github.com/resillix/racejs" style="color: #0066ff;">RaceJS</a>
      </p>
    </body>
    </html>
  `);
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    devMode: true,
    errorHandler: 'enabled',
  });
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('⚡ RaceJS Phase 5: Error Handler & Aggregation Demo');
  console.log('='.repeat(60));
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 DevTools: http://localhost:9229`);
  console.log(`\n💡 Open http://localhost:${PORT} for instructions\n`);
  console.log('Features enabled:');
  console.log('  ✓ Beautiful error pages with source context');
  console.log('  ✓ Error aggregation and grouping');
  console.log('  ✓ Solution suggestions (50+ patterns)');
  console.log('  ✓ Real-time DevTools tracking');
  console.log('  ✓ Trend detection and spike alerts');
  console.log('  ✓ Error management (resolve/ignore)');
  console.log('  ✓ Export functionality (JSON/CSV)');
  console.log('\n' + '='.repeat(60) + '\n');
});
