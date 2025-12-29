# 🔧 RaceJS Dev Mode - Complete Usage Guide

> **From Zero to Hero: Master RaceJS Developer Tools**

This guide walks you through using RaceJS Dev Mode features step-by-step, from basic setup to advanced techniques.

---

## 📖 Table of Contents

1. [Quick Start](#quick-start)
2. [Dev Logger](#dev-logger)
3. [Request Recording & Time-Travel Debugging](#request-recording--time-travel-debugging)
4. [Performance Profiling](#performance-profiling)
5. [Error Intelligence](#error-intelligence)
6. [DevTools Browser UI](#devtools-browser-ui)
7. [Integration Examples](#integration-examples)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Zero-Config Setup (Recommended)

The easiest way to get started - dev mode enables automatically in development:

```typescript
import { createApp } from '@racejs/core';

const app = createApp();
// Dev mode automatically enabled when NODE_ENV=development
// All features available with sensible defaults

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.compile();
app.listen(3000);
// Open http://localhost:3000/__racejs_devtools to see DevTools UI
```

**That's it!** You now have:
- ✅ Structured logging
- ✅ Request recording
- ✅ Performance profiling
- ✅ Error intelligence
- ✅ Browser DevTools UI

### Custom Configuration

For more control, customize dev mode options:

```typescript
import { createApp } from '@racejs/core';

const app = createApp({
  devMode: {
    // Global settings
    enabled: true,
    verbose: true,

    // Logger
    logger: {
      level: 'debug',
      colorize: true,
      timestamp: true
    },

    // DevTools UI
    devtools: {
      enabled: true,
      port: 0,  // Use same port as app
      path: '/__racejs_devtools',
      websocket: true,
      autoOpen: true  // Opens browser automatically
    },

    // Request recorder
    recorder: {
      enabled: true,
      maxRequests: 1000,
      storage: 'memory',  // or 'sqlite'
      recordBody: true,
      recordHeaders: true
    },

    // Performance profiler
    profiler: {
      enabled: true,
      cpuProfiling: true,
      memoryProfiling: true,
      flamegraphs: true,
      eventLoopMonitoring: true
    },

    // Error handler
    errorHandler: {
      prettyErrors: true,
      sourceMaps: true,
      aiSuggestions: true
    }
  }
});

app.listen(3000);
```

---

## Dev Logger

### Basic Logging

```typescript
import { createApp } from '@racejs/core';

const app = createApp();

// Access logger anywhere in your routes
app.get('/api/users', (req, res) => {
  // Log at different levels
  app.devMode?.logger?.trace('Trace level log');
  app.devMode?.logger?.debug('Debug level log');
  app.devMode?.logger?.info('Info level log');
  app.devMode?.logger?.warn('Warning level log');
  app.devMode?.logger?.error('Error level log');
  
  res.json({ users: [] });
});
```

### Structured Logging with Context

Add context to make logs more useful:

```typescript
app.get('/api/users/:id', (req, res) => {
  app.devMode?.logger?.info('Fetching user', {
    userId: req.params.id,
    ip: req.ip,
    method: req.method,
    path: req.path
  });
  
  const user = getUserById(req.params.id);
  
  if (!user) {
    app.devMode?.logger?.warn('User not found', {
      userId: req.params.id,
      requestId: req.id
    });
    return res.status(404).json({ error: 'Not found' });
  }
  
  app.devMode?.logger?.debug('User fetched successfully', {
    userId: user.id,
    email: user.email
  });
  
  res.json({ user });
});
```

### Custom Log Transports

Add your own log destinations:

```typescript
import { createApp, ConsoleTransport, JsonTransport } from '@racejs/core/dev';

// Custom transport
class FileTransport {
  write(entry) {
    fs.appendFileSync('./dev.log', JSON.stringify(entry) + '\n');
  }
}

const app = createApp({
  devMode: {
    logger: {
      level: 'debug',
      transports: [
        new ConsoleTransport({ colorize: true }),
        new JsonTransport({ pretty: true }),
        new FileTransport()
      ]
    }
  }
});
```

### Log Filtering

Filter logs by level in production:

```typescript
const app = createApp({
  devMode: {
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
    }
  }
});
```

---

## Request Recording & Time-Travel Debugging

### Automatic Recording

All requests are recorded automatically:

```typescript
const app = createApp({
  devMode: {
    recorder: {
      enabled: true,
      maxRequests: 100,
      storage: 'memory'
    }
  }
});

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

// Make requests - they're automatically recorded!
// View recordings in DevTools UI at /__racejs_devtools
```

### Programmatic Access to Recordings

```typescript
// Get all recordings
const recordings = app.devMode?.recorder?.getRecordings();
console.log(`Total recordings: ${recordings?.length}`);

// Get specific recording
const recording = app.devMode?.recorder?.getRecording('request-id-123');
console.log(recording);

// Filter recordings
const filtered = app.devMode?.recorder?.getRecordings({
  method: 'POST',
  status: 201,
  path: '/api/users'
});
```

### Time-Travel: Replay Requests

The killer feature - replay any request after making code changes:

```typescript
// 1. Make a request to your API
// 2. Change your code
// 3. Replay the request to see new behavior

// Replay a recorded request
const result = await app.devMode?.recorder?.replayRequest('request-id-123');

console.log('Original response:', result.original);
console.log('Replayed response:', result.replayed);
console.log('Differences:', result.differences);

// With options
const result = await app.devMode?.recorder?.replayRequest('request-id-123', {
  modifyRequest: (req) => {
    // Change request before replay
    req.headers['x-test'] = 'true';
    req.body.name = 'Modified';
    return req;
  },
  compareResponses: true
});
```

### Compare Responses

Compare old vs new responses after code changes:

```typescript
const comparison = app.devMode?.recorder?.compareResponses(
  'request-id-123',  // Original request
  'request-id-456'   // After code change
);

console.log('Status changed:', comparison.statusChanged);
console.log('Body changed:', comparison.bodyChanged);
console.log('Headers changed:', comparison.headersChanged);
console.log('Differences:', comparison.differences);
```

### Generate Tests from Recordings

Auto-generate test code from real traffic:

```typescript
// Generate Vitest test
const vitestTest = app.devMode?.recorder?.generateTest('request-id-123', 'vitest');
fs.writeFileSync('./tests/generated/user-api.test.ts', vitestTest);

// Generate Jest test
const jestTest = app.devMode?.recorder?.generateTest('request-id-123', 'jest');
fs.writeFileSync('./tests/generated/user-api.test.js', jestTest);

// Generate for all recordings
const recordings = app.devMode?.recorder?.getRecordings();
recordings?.forEach((recording, index) => {
  const test = app.devMode?.recorder?.generateTest(recording.id, 'vitest');
  fs.writeFileSync(`./tests/generated/test-${index}.test.ts`, test);
});
```

### Export to Other Formats

```typescript
// Generate cURL command
const curl = app.devMode?.recorder?.generateCurl('request-id-123');
console.log(curl);
// curl -X POST http://localhost:3000/api/users \
//   -H "Content-Type: application/json" \
//   -d '{"name":"John","email":"john@example.com"}'

// Export to Postman collection
const postman = app.devMode?.recorder?.exportPostman();
fs.writeFileSync('./postman-collection.json', JSON.stringify(postman, null, 2));

// Export to HAR format (HTTP Archive)
const har = app.devMode?.recorder?.exportHAR();
fs.writeFileSync('./requests.har', JSON.stringify(har, null, 2));
```

### Persistent Storage with SQLite

For longer recording sessions, use SQLite:

```typescript
const app = createApp({
  devMode: {
    recorder: {
      storage: 'sqlite',
      storePath: './dev-recordings.db',
      maxRequests: 10000
    }
  }
});

// Recordings persist across server restarts!
```

### Exclude Sensitive Routes

```typescript
const app = createApp({
  devMode: {
    recorder: {
      excludePaths: [
        '/auth/login',      // Exclude authentication
        '/auth/register',
        '/admin/*',         // Exclude admin routes
        '/payment/*',       // Exclude payment info
        '/__racejs_devtools' // Exclude devtools itself
      ],
      recordHeaders: false  // Don't record headers with tokens
    }
  }
});
```

---

## Performance Profiling

### CPU Profiling

Profile CPU usage per route:

```typescript
const app = createApp({
  devMode: {
    profiler: {
      enabled: true,
      cpuProfiling: true
    }
  }
});

// Start profiling
app.get('/api/heavy', async (req, res) => {
  app.devMode?.profiler?.startCPUProfile('heavy-route');
  
  // Do CPU-intensive work
  const result = await heavyComputation();
  
  const profile = await app.devMode?.profiler?.stopCPUProfile();
  
  // Profile saved automatically
  // View flame graph in DevTools UI
  
  res.json({ result });
});
```

### Memory Profiling

Take heap snapshots to detect memory leaks:

```typescript
app.get('/api/snapshot', async (req, res) => {
  // Take snapshot before
  await app.devMode?.profiler?.takeHeapSnapshot('./before.heapsnapshot');
  
  // Do memory-intensive work
  const data = await loadLargeDataset();
  
  // Take snapshot after
  await app.devMode?.profiler?.takeHeapSnapshot('./after.heapsnapshot');
  
  // Compare in Chrome DevTools
  res.json({ message: 'Snapshots taken' });
});
```

### Event Loop Monitoring

Detect blocking operations:

```typescript
const app = createApp({
  devMode: {
    profiler: {
      eventLoopMonitoring: true
    }
  }
});

// Monitor event loop lag
app.devMode?.profiler?.startEventLoopMonitoring();

// Get stats
setInterval(() => {
  const stats = app.devMode?.profiler?.stopEventLoopMonitoring();
  console.log('Event loop lag:', stats.lag);
  console.log('Max lag:', stats.maxLag);
  
  if (stats.lag > 100) {
    console.warn('⚠️ Event loop is blocked!');
  }
}, 5000);
```

### Performance Budgets

Set performance targets and get alerts:

```typescript
const app = createApp({
  devMode: {
    profiler: {
      budgets: {
        '/api/users': { maxLatency: 100 },      // 100ms budget
        '/api/posts': { maxLatency: 200 },
        '/api/search': { maxLatency: 500 }
      }
    }
  }
});

// Listen for budget violations
app.devMode?.profiler?.on('budget-exceeded', (route, latency) => {
  console.error(`⚠️ Budget exceeded: ${route} took ${latency}ms`);
  
  // Could send to monitoring service
  // sendToDatadog({ route, latency });
});
```

### Metrics Collection

Track and analyze performance metrics:

```typescript
// Get current metrics
const metrics = app.devMode?.metrics?.getMetrics();

console.log('Request rate:', metrics.requestRate, 'req/s');
console.log('P50 latency:', metrics.p50, 'ms');
console.log('P95 latency:', metrics.p95, 'ms');
console.log('P99 latency:', metrics.p99, 'ms');
console.log('Error rate:', metrics.errorRate, '%');
console.log('Memory usage:', metrics.memoryUsage);

// Track trends
const trends = app.devMode?.metrics?.getTrends('1h');
console.log('Last hour trends:', trends);
```

### Flame Graphs

Generate interactive flame graphs:

```typescript
// CPU profile automatically generates flame graph
app.devMode?.profiler?.startCPUProfile('my-profile');

// ... do work ...

const profile = await app.devMode?.profiler?.stopCPUProfile();

// Flame graph available in DevTools UI
// Or export for external tools
const flamegraph = app.devMode?.profiler?.generateFlameGraph(profile);
fs.writeFileSync('./flamegraph.json', JSON.stringify(flamegraph));
```

---

## Error Intelligence

### Beautiful Error Pages

Errors automatically show beautiful pages in development:

```typescript
const app = createApp({
  devMode: {
    errorHandler: {
      prettyErrors: true,
      sourceMaps: true
    }
  }
});

app.get('/api/error', (req, res) => {
  // This error will show a beautiful page with:
  // - Source code context
  // - Enhanced stack trace
  // - Variable values
  // - Similar errors
  throw new Error('Something went wrong');
});
```

### AI-Powered Error Suggestions

Get automatic fix suggestions:

```typescript
const app = createApp({
  devMode: {
    errorHandler: {
      aiSuggestions: true
    }
  }
});

// Listen for errors
app.devMode?.errorHandler?.on('error', async (error, context) => {
  // Get AI suggestions
  const suggestions = await app.devMode?.errorHandler?.getSuggestions(error);
  
  suggestions?.forEach(suggestion => {
    console.log('💡 Suggestion:', suggestion.title);
    console.log('   ', suggestion.description);
    console.log('   Code:', suggestion.code);
  });
});
```

### Error Aggregation

Track and analyze errors over time:

```typescript
// Get error statistics
const stats = app.devMode?.errorAggregator?.getStats('24h');

console.log('Total errors:', stats.total);
console.log('Unique errors:', stats.unique);
console.log('Error rate:', stats.rate);

// Get grouped errors
const groups = app.devMode?.errorAggregator?.groupSimilar();

groups?.forEach(group => {
  console.log(`Error: ${group.message}`);
  console.log(`  Count: ${group.count}`);
  console.log(`  First seen: ${group.firstSeen}`);
  console.log(`  Last seen: ${group.lastSeen}`);
});
```

### Custom Error Handling

```typescript
app.use((err, req, res, next) => {
  // Log to dev mode
  app.devMode?.errorHandler?.trackError(err, {
    route: req.path,
    method: req.method,
    userId: req.user?.id
  });
  
  // Custom response
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

---

## DevTools Browser UI

### Accessing DevTools

Open the browser UI:

```typescript
const app = createApp({
  devMode: {
    devtools: {
      enabled: true,
      autoOpen: true  // Opens automatically on start
    }
  }
});

app.listen(3000);
// DevTools opens at http://localhost:3000/__racejs_devtools
```

### Dashboard Tab

The dashboard shows real-time metrics:
- Request count (live counter)
- Error rate (percentage)
- Average response time
- Memory usage (chart)
- Active routes
- Recent activity

### Routes Tab

View all registered routes:
- HTTP methods
- Route patterns
- Middleware chain
- Performance stats
- Recent requests

Click a route to:
- See route details
- View handler code
- Test with sample request
- See performance history

### Requests Tab

Real-time request log:
- All HTTP requests
- Filter by method, status, path
- Search by content
- Sort by time, duration
- Click to see full details

For each request:
- Request headers/body
- Response headers/body
- Timing breakdown
- Replay button
- Export to cURL/Postman
- Generate test

### Errors Tab

Error dashboard:
- Error list with grouping
- Error frequency chart
- Filter by status, time, route
- Search by message

For each error:
- Full stack trace
- Source code context
- Variable values
- AI suggestions
- Similar errors
- Mark as resolved

### Performance Tab

Performance monitoring:
- Real-time latency chart
- P50/P95/P99 metrics
- Request rate graph
- Memory usage chart
- Event loop lag indicator
- CPU usage (if profiling)
- Interactive flame graphs

---

## Integration Examples

### With Express Middleware

```typescript
import { createApp } from '@racejs/core';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = createApp();

// Express middleware works!
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Your routes
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000);
```

### With Database (Prisma)

```typescript
import { createApp } from '@racejs/core';
import { PrismaClient } from '@prisma/client';

const app = createApp();
const prisma = new PrismaClient();

app.get('/api/users', async (req, res) => {
  // Log query
  app.devMode?.logger?.debug('Fetching users from database');
  
  const users = await prisma.user.findMany();
  
  // Log result
  app.devMode?.logger?.info('Users fetched', {
    count: users.length
  });
  
  res.json({ users });
});
```

### With Authentication

```typescript
import { createApp } from '@racejs/core';
import jwt from 'jsonwebtoken';

const app = createApp();

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    app.devMode?.logger?.warn('Missing auth token', {
      path: req.path,
      ip: req.ip
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    app.devMode?.logger?.debug('User authenticated', {
      userId: req.user.id
    });
    next();
  } catch (err) {
    app.devMode?.logger?.error('Invalid token', {
      error: err.message
    });
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Protected route
app.get('/api/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});
```

### With WebSockets

```typescript
import { createApp } from '@racejs/core';
import { WebSocketServer } from 'ws';

const app = createApp();

app.listen(3000, () => {
  const wss = new WebSocketServer({ server: app.server });
  
  wss.on('connection', (ws) => {
    app.devMode?.logger?.info('WebSocket client connected');
    
    ws.on('message', (message) => {
      app.devMode?.logger?.debug('WebSocket message', {
        message: message.toString()
      });
    });
    
    ws.on('close', () => {
      app.devMode?.logger?.info('WebSocket client disconnected');
    });
  });
});
```

---

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// Trace: Very detailed debugging
app.devMode?.logger?.trace('Variable value:', { x, y, z });

// Debug: Debugging information
app.devMode?.logger?.debug('Processing request', { userId });

// Info: Important events
app.devMode?.logger?.info('User created', { userId });

// Warn: Warnings that don't stop execution
app.devMode?.logger?.warn('Rate limit approaching', { current, limit });

// Error: Errors that need attention
app.devMode?.logger?.error('Database connection failed', { error });

// Fatal: Critical errors
app.devMode?.logger?.fatal('Server cannot start', { error });
```

### 2. Exclude Noisy Routes

```typescript
const app = createApp({
  devMode: {
    recorder: {
      excludePaths: [
        '/health',          // Health checks
        '/metrics',         // Metrics endpoint
        '/favicon.ico',     // Browser requests
        '/__racejs_devtools' // DevTools itself
      ]
    }
  }
});
```

### 3. Set Memory Limits

```typescript
const app = createApp({
  devMode: {
    recorder: {
      maxRequests: 100,  // Keep only last 100 requests
      storage: 'memory'
    }
  }
});
```

### 4. Use SQLite for Long Sessions

```typescript
const app = createApp({
  devMode: {
    recorder: {
      storage: 'sqlite',
      storePath: './dev-recordings.db'
    }
  }
});
```

### 5. Generate Tests Regularly

```typescript
// After manual testing session
const recordings = app.devMode?.recorder?.getRecordings();
recordings?.forEach((recording, i) => {
  const test = app.devMode?.recorder?.generateTest(recording.id, 'vitest');
  fs.writeFileSync(`./tests/generated/${i}.test.ts`, test);
});
```

### 6. Monitor Performance Budgets

```typescript
const app = createApp({
  devMode: {
    profiler: {
      budgets: {
        '/api/users': { maxLatency: 100 },
        '/api/posts': { maxLatency: 200 }
      }
    }
  }
});

app.devMode?.profiler?.on('budget-exceeded', (route, latency) => {
  // Send alert
  console.error(`⚠️ Performance budget exceeded: ${route}`);
});
```

### 7. Disable in Production

```typescript
const app = createApp({
  devMode: {
    // Automatically disabled when NODE_ENV=production
    enabled: process.env.NODE_ENV !== 'production'
  }
});
```

---

## Troubleshooting

### DevTools UI Not Loading

**Problem:** Can't access `/__racejs_devtools`

**Solutions:**
```typescript
// 1. Check dev mode is enabled
console.log('Dev mode:', app.devMode !== undefined);

// 2. Check DevTools configuration
const app = createApp({
  devMode: {
    devtools: {
      enabled: true,
      port: 0,  // Use same port as app
      path: '/__racejs_devtools'
    }
  }
});

// 3. Check NODE_ENV
console.log('NODE_ENV:', process.env.NODE_ENV);
// Should be 'development' or not set
```

### Recordings Not Appearing

**Problem:** No recordings in DevTools

**Solutions:**
```typescript
// 1. Check recorder is enabled
console.log('Recorder:', app.devMode?.recorder !== undefined);

// 2. Check you're not excluding the route
const app = createApp({
  devMode: {
    recorder: {
      enabled: true,
      excludePaths: []  // Make sure route not excluded
    }
  }
});

// 3. Check storage
const recordings = app.devMode?.recorder?.getRecordings();
console.log('Total recordings:', recordings?.length);
```

### High Memory Usage

**Problem:** Dev mode using too much memory

**Solutions:**
```typescript
// 1. Limit recordings
const app = createApp({
  devMode: {
    recorder: {
      maxRequests: 50,  // Lower limit
      excludePaths: ['/health', '/metrics']
    }
  }
});

// 2. Use SQLite instead of memory
const app = createApp({
  devMode: {
    recorder: {
      storage: 'sqlite',
      storePath: './recordings.db'
    }
  }
});

// 3. Clear recordings periodically
setInterval(() => {
  app.devMode?.recorder?.clear();
}, 60000); // Clear every minute
```

### Profiler Not Working

**Problem:** CPU profiling or flame graphs not available

**Solutions:**
```typescript
// 1. Enable profiler
const app = createApp({
  devMode: {
    profiler: {
      enabled: true,
      cpuProfiling: true,
      flamegraphs: true
    }
  }
});

// 2. Check Node.js version
// Requires Node.js 18+
console.log('Node version:', process.version);

// 3. Check inspector is available
console.log('Inspector:', process.binding('inspector'));
```

### Error Suggestions Not Showing

**Problem:** AI suggestions not appearing

**Solutions:**
```typescript
// 1. Enable AI suggestions
const app = createApp({
  devMode: {
    errorHandler: {
      aiSuggestions: true
    }
  }
});

// 2. Check error handler is tracking
app.devMode?.errorHandler?.on('error', (error) => {
  console.log('Error tracked:', error.message);
});

// 3. Check network access
// AI suggestions may require external API
```

---

## Next Steps

- 📖 Read the [Complete Dev Mode Analysis](./dev-mode-analysis.md)
- 🆚 Compare with [Next.js](./nextjs-comparison.md)
- 🏗️ Learn about [Architecture](./architecture.md)
- ⚡ Optimize [Performance](./performance.md)

---

**Happy Developing! 🚀**

Built with ⚡️ by the RaceJS team at [Resillix](https://resillix.com)
