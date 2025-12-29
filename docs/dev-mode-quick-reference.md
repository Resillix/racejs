# 📋 RaceJS Dev Mode - Quick Reference

> **Quick commands and code snippets for RaceJS developer tools**

---

## ⚡ Quick Start

```typescript
import { createApp } from '@racejs/core';

const app = createApp();
// Dev mode auto-enabled in development!

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(3000);
// DevTools: http://localhost:3000/__racejs_devtools
```

---

## 🔧 Configuration Snippets

### Minimal Config
```typescript
const app = createApp();  // Zero config
```

### Full Config
```typescript
const app = createApp({
  devMode: {
    enabled: true,
    verbose: true,
    logger: { level: 'debug', colorize: true },
    devtools: { enabled: true, autoOpen: true },
    recorder: { enabled: true, storage: 'sqlite' },
    profiler: { enabled: true, cpuProfiling: true },
    errorHandler: { prettyErrors: true, aiSuggestions: true }
  }
});
```

---

## 📝 Logger

```typescript
// Basic logging
app.devMode?.logger?.trace('trace');
app.devMode?.logger?.debug('debug');
app.devMode?.logger?.info('info');
app.devMode?.logger?.warn('warn');
app.devMode?.logger?.error('error');

// With context
app.devMode?.logger?.info('User created', { userId: 123, email: 'user@example.com' });
```

---

## 📹 Request Recording

```typescript
// Get all recordings
const recordings = app.devMode?.recorder?.getRecordings();

// Get specific recording
const recording = app.devMode?.recorder?.getRecording('request-id');

// Replay request
const result = await app.devMode?.recorder?.replayRequest('request-id');

// Compare responses
const comparison = app.devMode?.recorder?.compareResponses('id1', 'id2');

// Generate test
const test = app.devMode?.recorder?.generateTest('request-id', 'vitest');

// Generate cURL
const curl = app.devMode?.recorder?.generateCurl('request-id');

// Export to Postman
const postman = app.devMode?.recorder?.exportPostman();

// Clear recordings
app.devMode?.recorder?.clear();
```

---

## ⚡ Performance Profiling

```typescript
// CPU profiling
app.devMode?.profiler?.startCPUProfile('profile-name');
// ... do work ...
const profile = await app.devMode?.profiler?.stopCPUProfile();

// Memory snapshot
await app.devMode?.profiler?.takeHeapSnapshot('./heap.heapsnapshot');

// Event loop monitoring
app.devMode?.profiler?.startEventLoopMonitoring();
const stats = app.devMode?.profiler?.stopEventLoopMonitoring();

// Get metrics
const metrics = app.devMode?.metrics?.getMetrics();
console.log('P95:', metrics.p95);

// Listen for budget violations
app.devMode?.profiler?.on('budget-exceeded', (route, latency) => {
  console.log(`Budget exceeded: ${route} took ${latency}ms`);
});
```

---

## 🐛 Error Handling

```typescript
// Listen for errors
app.devMode?.errorHandler?.on('error', async (error, context) => {
  const suggestions = await app.devMode?.errorHandler?.getSuggestions(error);
  console.log('Suggestions:', suggestions);
});

// Get error stats
const stats = app.devMode?.errorAggregator?.getStats('24h');
console.log('Total errors:', stats.total);

// Group similar errors
const groups = app.devMode?.errorAggregator?.groupSimilar();
```

---

## 🌐 DevTools UI

**Access:** `http://localhost:3000/__racejs_devtools`

**Tabs:**
- **Dashboard** - Real-time metrics
- **Routes** - All registered routes
- **Requests** - Request log with replay
- **Errors** - Error tracking
- **Performance** - CPU, memory, flame graphs

---

## 🎯 Common Patterns

### Log Request/Response
```typescript
app.use((req, res, next) => {
  app.devMode?.logger?.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});
```

### Performance Budget
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
```

### Exclude Routes from Recording
```typescript
const app = createApp({
  devMode: {
    recorder: {
      excludePaths: ['/health', '/metrics', '/__racejs_devtools']
    }
  }
});
```

### Generate Tests After Testing
```typescript
const recordings = app.devMode?.recorder?.getRecordings();
recordings?.forEach((r, i) => {
  const test = app.devMode?.recorder?.generateTest(r.id, 'vitest');
  fs.writeFileSync(`./tests/generated/${i}.test.ts`, test);
});
```

---

## 🔒 Production Safety

```typescript
// Automatically disabled in production
const app = createApp({
  devMode: {
    enabled: process.env.NODE_ENV !== 'production'
  }
});

// Or explicit disable
const app = createApp({
  devMode: false
});
```

---

## 🚨 Troubleshooting

### DevTools not loading?
```typescript
console.log('Dev mode enabled:', app.devMode !== undefined);
console.log('NODE_ENV:', process.env.NODE_ENV);
```

### No recordings?
```typescript
console.log('Recorder enabled:', app.devMode?.recorder !== undefined);
const recordings = app.devMode?.recorder?.getRecordings();
console.log('Total recordings:', recordings?.length);
```

### High memory?
```typescript
const app = createApp({
  devMode: {
    recorder: {
      maxRequests: 50,  // Lower limit
      storage: 'sqlite' // Use disk instead of memory
    }
  }
});
```

---

## 📚 Full Documentation

- [Dev Mode Analysis](./dev-mode-analysis.md) - Complete feature overview
- [Usage Guide](./dev-mode-usage-guide.md) - Step-by-step examples
- [Next.js Comparison](./nextjs-comparison.md) - Framework comparison
- [Architecture](./architecture.md) - How it works
- [Hot Reload](./guides/HOT-RELOAD.md) - Hot reload guide

---

## 🎓 Learning Path

1. Start with [Quick Start](#-quick-start) (5 min)
2. Read [Usage Guide](./dev-mode-usage-guide.md) (30 min)
3. Try [Request Recording](#-request-recording) (15 min)
4. Explore [Performance Profiling](#-performance-profiling) (15 min)
5. Check [DevTools UI](#-devtools-ui) (10 min)

**Total: ~75 minutes to become proficient**

---

**Built with ⚡️ by the RaceJS team at [Resillix](https://resillix.com)**
