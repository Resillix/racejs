# Performance Tuning Guide

This guide covers techniques to maximize performance when using RaceJS (`@racejs/core`).

## Out-of-the-Box Performance

RaceJS is **2-4× faster than Express 4.x** without any tuning:
- Radix trie router with O(k) lookup
- Zero-cost middleware pipeline
- Lazy request parsing
- Optimized response helpers

## Quick Wins

### 1. Always Compile Routes

```javascript
app.compile(); // Call before app.listen()
```

**Impact:** 15-30% additional throughput improvement

**Why:** Freezes router structure, enables V8 optimizations (inline caching, hidden classes)

### 2. Use Node.js 18+

```bash
node --version # Should be v18 or higher
```

**Impact:** 10-20% improvement with latest Node versions

**Why:** V8 optimizations, faster async/await, improved GC

### 3. Run in Production Mode

```bash
NODE_ENV=production node app.js
```

**Impact:** Various optimizations enabled

## Application-Level Optimizations

### Minimize Middleware Stack

Each middleware adds overhead. Profile and remove unnecessary middleware:

```javascript
// ❌ Too many middleware
app.use(logger);
app.use(cors);
app.use(helmet);
app.use(rateLimit);
app.use(compression);

// ✅ Only what you need
app.use(logger);
app.use(helmet); // Security headers
```

### Prefer Route-Specific Middleware

Global middleware runs on every request:

```javascript
// ❌ Global (runs for all routes)
app.use(authMiddleware);

// ✅ Route-specific (only where needed)
app.get('/api/protected', authMiddleware, handler);
```

### Lazy Parse Request Data

Only parse what you need:

```javascript
app.get('/user/:id', (req, res) => {
  // req.query is parsed only when accessed
  if (req.url.includes('?')) {
    const filters = req.query; // Parsed here
  }
  res.json({ id: req.params.id });
});
```

## Response Optimizations

### Fast JSON Serialization

For simple objects, `JSON.stringify` is very fast:

```javascript
// ✅ Fast path
res.json({ id: 123, name: 'User' });

// ❌ Slower (but still fast)
const data = complexTransform(obj);
res.json(data);
```

### Set Content-Type Once

Avoid repeated header lookups:

```javascript
// ❌ Slower
res.set('Content-Type', 'application/json');
res.json(data);

// ✅ Faster
res.json(data); // Sets content-type automatically
```

### Use Lowercase Headers

Node.js stores headers in lowercase internally:

```javascript
// Slower (extra normalization)
res.set('Content-Type', 'text/html');

// Faster (direct)
res.set('content-type', 'text/html');
```

## Router Optimizations

### Static Routes First

Static routes match faster than parameter routes:

```javascript
// ✅ Optimal order
app.get('/users/me', getCurrentUser);
app.get('/users/admin', getAdmin);
app.get('/users/:id', getUser);

// Router tries static matches first
```

### Avoid Deep Nesting

Flat routes are faster:

```javascript
// Slower
app.get('/api/v1/users/:userId/posts/:postId/comments/:commentId', handler);

// Faster
app.get('/comments/:id', handler);
```

### Limit Wildcard Routes

Wildcards are slower than specific routes:

```javascript
// ❌ Catches everything
app.get('/*', handler);

// ✅ Specific routes
app.get('/page1', handler1);
app.get('/page2', handler2);
```

## Node.js Runtime Flags

### Optimize for Throughput

```bash
node \
  --max-old-space-size=4096 \
  --max-semi-space-size=128 \
  app.js
```

### Enable CPU Profiling (Dev)

```bash
node --prof app.js
# Generate load
# Ctrl+C
node --prof-process isolate-*.log > profile.txt
```

### Memory Profiling

```bash
node --trace-gc app.js
# Watch for excessive GC activity
```

## Clustering

Use all CPU cores:

```javascript
import cluster from 'cluster';
import os from 'os';
import { createApp } from '@express/core';

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart
  });
} else {
  const app = createApp();

  // Register routes...

  app.compile();
  app.listen(3000);
}
```

**Impact:** Near-linear scaling with CPU cores

## Load Balancing

### Nginx Upstream

```nginx
upstream nodejs {
  least_conn;
  server localhost:3000;
  server localhost:3001;
  server localhost:3002;
  server localhost:3003;
}

server {
  listen 80;

  location / {
    proxy_pass http://nodejs;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
  }
}
```

## Caching Strategies

### Response Caching

```javascript
const cache = new Map();

app.get('/expensive-data', (req, res) => {
  const cached = cache.get('data');
  if (cached) {
    res.json(cached);
    return;
  }

  const data = computeExpensiveData();
  cache.set('data', data);
  res.json(data);
});
```

### HTTP Cache Headers

```javascript
app.get('/static-data', (req, res) => {
  res.set('cache-control', 'public, max-age=3600');
  res.json(data);
});
```

## Database Optimizations

### Connection Pooling

```javascript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
});

app.get('/users', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users');
    res.json(result.rows);
  } finally {
    client.release();
  }
});
```

### Query Optimization

- Use indexes
- Limit result sets
- Avoid N+1 queries
- Use prepared statements

## Monitoring

### Key Metrics

Track these metrics:

1. **Request rate** (RPS)
2. **Latency percentiles** (p50, p95, p99)
3. **Error rate** (%)
4. **CPU usage** (%)
5. **Memory usage** (MB)
6. **GC pause time** (ms)

### Tools

- **autocannon**: Load testing
- **clinic.js**: Performance profiling
- **0x**: Flamegraphs
- **node --prof**: CPU profiling

## Benchmarking

### Baseline

```bash
# Simple endpoint
autocannon -c 100 -d 30 http://localhost:3000/ping

# With parameters
autocannon -c 100 -d 30 http://localhost:3000/user/123

# POST with body
autocannon -c 100 -d 30 -m POST \
  -H 'content-type: application/json' \
  -b '{"test":true}' \
  http://localhost:3000/api
```

### Interpret Results

Good targets for a simple JSON endpoint on modern hardware:

- **RPS:** 40,000+ (single core)
- **p99 latency:** <10ms
- **Error rate:** 0%

## Common Pitfalls

### ❌ Synchronous Operations

```javascript
// Blocks event loop
const data = fs.readFileSync('/large/file');
```

### ❌ Uncached Regex

```javascript
// Compiles regex every request
if (path.match(/\/user\/\d+/)) { ... }
```

### ❌ Large JSON Objects

```javascript
// Slow serialization
res.json(massiveObject);
```

### ❌ Memory Leaks

```javascript
const cache = new Map(); // Grows forever
app.get('/leak', (req, res) => {
  cache.set(Date.now(), data); // Never cleaned
  res.send('ok');
});
```

## Production Checklist

- [ ] `NODE_ENV=production`
- [ ] `app.compile()` called
- [ ] Node.js 20+ in use
- [ ] Clustering enabled
- [ ] Rate limiting configured
- [ ] Monitoring in place
- [ ] Error handling implemented
- [ ] Logs structured
- [ ] Health check endpoint
- [ ] Graceful shutdown

## Further Reading

- [V8 Optimization Tips](https://v8.dev/docs)
- [Node.js Performance](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
