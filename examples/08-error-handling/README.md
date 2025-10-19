# Phase 5: Error Handler & Aggregation Example

This example demonstrates **RaceJS's advanced error handling capabilities**, including beautiful error pages, intelligent error aggregation, solution suggestions, and real-time DevTools tracking.

## 🎯 What This Example Demonstrates

### Core Features

1. **Beautiful Error Pages**
   - 4-tab interface (Source Code, Stack Trace, Solutions, Request)
   - Source code context with ±10 lines around error
   - Syntax highlighting (ready for highlight.js integration)
   - Editor links (VS Code, WebStorm, Sublime)
   - Copy error and retry request buttons

2. **Error Aggregation**
   - Groups duplicate errors by normalized stack trace hash
   - Tracks occurrence count and timestamps
   - Maintains first seen and last seen timestamps
   - Associates errors with routes and HTTP methods

3. **Solution Suggestions**
   - 50+ built-in solution patterns
   - Pattern matching against error messages and stack traces
   - Confidence scoring for solutions
   - Code examples and helpful links
   - Covers common errors: undefined properties, module not found, file system errors, etc.

4. **Real-time DevTools Integration**
   - WebSocket-based live error tracking
   - Instant notifications when errors occur
   - Statistics dashboard (total, unique, error rate, critical count)
   - Filter by status, severity, or search terms
   - Click-through error details with occurrences list

5. **Trend Detection**
   - Analyzes error frequency over time
   - Detects increasing, decreasing, or stable trends
   - Visual indicators in DevTools (📈 📉 ➡️)

6. **Spike Detection**
   - Monitors error rates in real-time
   - Alerts when current rate exceeds 10x average
   - Automatic notifications in DevTools

7. **Error Management**
   - Mark errors as resolved or ignored
   - Clear individual or all errors
   - Export errors in JSON or CSV format
   - Status badges (Open, Resolved, Ignored)

## 🚀 Running the Example

### Installation

```bash
# From the repository root
pnpm install

# Or from this directory
cd examples/08-error-handling
pnpm install
```

### Start the Server

```bash
pnpm start
```

The server will start on `http://localhost:3000`

### Open DevTools

Navigate to `http://localhost:3000/__devtools` and click on the **🚨 Errors** tab.

## 📖 How to Use

### 1. Explore Error Pages

Visit the home page at `http://localhost:3000` and click any of the error links:

- **TypeError: Undefined Property** - Common null/undefined access
- **ReferenceError** - Accessing undefined variables
- **JSON Parse Error** - Invalid JSON syntax
- **Custom Error** - User-defined error messages
- **Async Error** - Errors in async/await code
- **File System Error** - ENOENT file not found
- **Type Coercion Error** - Wrong type usage
- **Range Error** - Invalid array/number ranges
- **Stack Overflow** - Infinite recursion (use carefully!)

Each error will display:

- ✅ Error name and message
- ✅ Source code context (±10 lines)
- ✅ Full stack trace with clickable file paths
- ✅ AI-suggested solutions with confidence scores
- ✅ Request details (method, URL, headers, etc.)

### 2. Test Error Aggregation

1. Click the **"Duplicate Error"** link multiple times (5-10 clicks)
2. Open DevTools → Errors tab
3. Notice:
   - Only **ONE** error entry appears
   - The **count** increases with each occurrence
   - **Trend** indicator shows ↗️ (increasing)
   - **Last Seen** timestamp updates

### 3. Test Spike Detection

1. Click the **"Intermittent Error"** link rapidly 20-30 times
2. Watch the DevTools Errors tab
3. You'll see:
   - A notification alert appears when spike is detected
   - Error rate jumps in the statistics
   - Alert triggers when current rate > 10x average

### 4. Test Error Management

1. Generate a few different errors
2. In DevTools, click on any error row
3. The **details panel** slides in from the right showing:
   - Full stack trace
   - List of occurrences (up to 10 most recent)
   - Each occurrence shows route, method, and timestamp
4. Try the action buttons:
   - **✓ Resolve** - Marks error as resolved
   - **◯ Ignore** - Marks error as ignored
   - **✕ Close** - Closes the details panel
5. Use filters to show only specific errors:
   - Filter by status (Open/Resolved/Ignored)
   - Filter by severity (Critical/High/Medium/Low)
   - Search by error message or type

### 5. Test Export Functionality

1. After generating several errors
2. Click the **"Export"** button in the Errors tab
3. Choose format (JSON or CSV)
4. The export data will be sent to your browser
5. JSON format includes full error details
6. CSV format provides a table-ready export

## 🎨 Error Page Features

### Source Code Tab

- Shows the file where the error occurred
- Displays ±10 lines of context
- Highlights the exact error line
- Shows line numbers
- Displays column position

### Stack Trace Tab

- Full JavaScript stack trace
- File paths with line and column numbers
- Clickable editor links
- Formatted for easy reading

### Solutions Tab

- AI-suggested solutions based on error patterns
- Confidence scores (0-100%)
- Step-by-step instructions
- Code examples
- Links to documentation

### Request Tab

- HTTP method and URL
- Headers
- Query parameters
- Request body
- Timestamp

## 🔧 DevTools Errors Tab Features

### Statistics Cards

- **Total Errors**: Cumulative count of all errors
- **Unique Errors**: Number of distinct error types
- **Errors/min**: Current error rate
- **Critical**: Count of critical severity errors

### Error Table Columns

1. **Error** - Message (truncated with ellipsis)
2. **Type** - Error class name (code formatted)
3. **Count** - Number of occurrences
4. **Severity** - Colored badge (Critical/High/Medium/Low)
5. **Status** - Current status (Open/Resolved/Ignored)
6. **Trend** - Direction indicator (↗️↘️➡️)
7. **Last Seen** - Relative timestamp

### Filter Controls

- **Status Filter**: All, Open, Resolved, Ignored
- **Severity Filter**: All, Critical, High, Medium, Low
- **Search**: Real-time text search across error messages
- **Clear Filters**: Reset all filters
- **Clear All**: Delete all errors (with confirmation)
- **Export**: Download errors as JSON or CSV

### Real-time Features

- WebSocket connection for instant updates
- Toast notifications for new errors
- Automatic table refresh
- Live error rate calculation
- Spike alert notifications

## 📊 Error Severity Levels

Errors are automatically classified into severity levels:

- **Critical** 🔴 - System-breaking errors (ReferenceError, stack overflow)
- **High** 🟠 - Major functionality errors (TypeError, file system errors)
- **Medium** 🟡 - Recoverable errors (validation, JSON parse)
- **Low** 🟢 - Minor issues (warnings, deprecations)

## 🎯 Solution Patterns Included

The error handler recognizes and provides solutions for:

### JavaScript Errors

- `Cannot read property 'X' of null/undefined`
- `X is not defined`
- `X is not a function`
- `Unexpected token in JSON`
- `Maximum call stack size exceeded`

### Node.js Errors

- `ENOENT: no such file or directory`
- `EACCES: permission denied`
- `EADDRINUSE: port already in use`
- `MODULE_NOT_FOUND`
- `ERR_INVALID_ARG_TYPE`

### Type Errors

- `Cannot convert undefined to object`
- `X.toUpperCase is not a function`
- `Invalid array length`
- Type coercion failures

### And 40+ more patterns!

## 🧪 Testing Scenarios

### Scenario 1: Production Error Simulation

```bash
# Generate realistic error patterns
for i in {1..5}; do
  curl http://localhost:3000/error/undefined
  sleep 1
done
```

Expected: Error appears once in DevTools with count=5, trend=increasing

### Scenario 2: Mixed Error Types

```bash
# Generate different error types
curl http://localhost:3000/error/undefined
curl http://localhost:3000/error/reference
curl http://localhost:3000/error/json
curl http://localhost:3000/error/custom
```

Expected: 4 distinct errors in DevTools, each with count=1

### Scenario 3: Spike Detection

```bash
# Rapid error generation
for i in {1..30}; do
  curl http://localhost:3000/error/intermittent &
done
wait
```

Expected: Spike alert notification appears in DevTools

### Scenario 4: Error Resolution Workflow

1. Generate an error: `curl http://localhost:3000/error/custom`
2. Open DevTools → Errors tab
3. Click on the error to view details
4. Click "Resolve" button
5. Verify status changes to "Resolved"
6. Use status filter to show only "Open" errors
7. Verify resolved error is hidden

## 💡 Advanced Usage

### Custom Error Notifications

The error handler supports multiple notification channels:

```javascript
import { createRaceApp } from '@racejs/core';
import { SlackNotifier, WebhookNotifier } from '@racejs/core/dev/error';

const app = createRaceApp({
  dev: {
    enabled: true,
    errorNotifier: {
      slack: {
        webhookUrl: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
        channel: '#errors',
      },
      webhook: {
        url: 'https://your-api.com/errors',
        method: 'POST',
      },
    },
  },
});
```

### Custom Solution Patterns

Add your own error solution patterns:

```javascript
const customPatterns = [
  {
    id: 'custom-db-error',
    pattern: /Database connection failed/i,
    severity: 'critical',
    solutions: [
      {
        title: 'Check Database Connection',
        description: 'Verify database credentials and network connectivity',
        solution: 'Ensure your .env file has correct DB_HOST, DB_USER, and DB_PASS',
        code: 'DB_HOST=localhost\nDB_USER=root\nDB_PASS=secret',
        links: [],
        confidence: 0.9,
      },
    ],
  },
];

// Add to solution engine
errorHandler.solutionEngine.addPatterns(customPatterns);
```

### Error Storage Options

Choose between memory or file-based storage:

```javascript
import { FileErrorStorage } from '@racejs/core/dev/error';

const app = createRaceApp({
  dev: {
    enabled: true,
    errorStorage: new FileErrorStorage('.racejs/errors.json'),
  },
});
```

## 📚 API Reference

### Error Handler API

```javascript
// Get error handler instance
const errorHandler = app.devMode.getErrorHandler();

// Handle error manually
errorHandler.handle(error, req, res);

// Enhance error with context
const enhancedError = errorHandler.enhance(error, req);

// Get error aggregator
const aggregator = app.devMode.getErrorAggregator();

// Track error
const hash = aggregator.track(error, { route: '/api/users', method: 'GET' });

// Get error by hash
const error = aggregator.getError(hash);

// List all errors
const errors = aggregator.listErrors();

// Filter errors
const openErrors = aggregator.listErrors({ status: 'open' });
const criticalErrors = aggregator.listErrors({ severity: 'critical' });

// Get statistics
const stats = aggregator.getStats();

// Clear all errors
aggregator.clearAll();
```

## 🐛 Troubleshooting

### Error pages not showing?

Make sure dev mode is enabled:

```javascript
const app = createRaceApp({
  dev: { enabled: true },
});
```

### DevTools not connecting?

1. Check that the server is running
2. Visit `http://localhost:3000/__devtools`
3. Check browser console for WebSocket errors
4. Ensure port 3000 is not blocked by firewall

### Errors not appearing in DevTools?

1. Make sure you're on the Errors tab (🚨 icon)
2. Check filter settings (might be filtering out errors)
3. Click "Clear Filters" button
4. Verify WebSocket connection status (green dot in header)

### Export not working?

Currently, export data is sent via WebSocket. Future versions will trigger browser downloads.

## 📝 Notes

- This example runs with `dev: { enabled: true }` - **never use this in production!**
- Error pages include source code - be careful not to expose sensitive information
- The recursion error example can crash the process - use carefully
- Error storage is in-memory by default (lost on restart)
- Use FileErrorStorage for persistence across restarts

## 🎓 Learning Resources

- [Error Handler Architecture](../../docs/phase-5-implementation-plan.md)
- [DevTools Protocol](../../packages/core/src/dev/devtools-protocol.ts)
- [Solution Patterns](../../packages/core/src/dev/error/error-solutions.ts)
- [Error Renderer](../../packages/core/src/dev/error/error-renderer.ts)

## 🤝 Contributing

Found a bug or have a suggestion? Open an issue or submit a PR!

## 📄 License

MIT

---

**Built with ⚡ RaceJS** - The fastest way to build Node.js applications
