# Migration Guide: Express 4.x → RaceJS

This guide will help you migrate from Express 4.x to RaceJS while maintaining compatibility.

## Overview

RaceJS provides:
- **2-4× throughput** (RPS) compared to Express 4.x
- **Significantly lower latency** with optimized request handling
- **Express 4.x API compatibility** via `@racejs/compat`
- **High-performance core** with `@racejs/core`
- Zero-config for simple apps, with performance feature flags for advanced use

## Quick Start

### Installation

```bash
pnpm add @racejs/compat
# or
npm install @racejs/compat
```

### Basic Migration

**Before (Express 4.x):**
```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ hello: 'world' });
});

app.listen(3000);
```

**After (RaceJS with Compat Layer):**
```javascript
import express from '@racejs/compat';

const app = createApp();

app.get('/', (req, res) => {
  res.json({ hello: 'world' });
});

// Compile routes for optimal performance
app.compile();

app.listen(3000);
```

## Key Differences

### 1. ESM First

The new core uses ESM (ECMAScript Modules) by default:

```javascript
// Express 4.x
const express = require('express');

// @express/core
import { createApp } from '@express/core';
```

### 2. Explicit Compilation

For maximum performance, call `app.compile()` after registering all routes:

```javascript
// Register all routes
app.get('/users', handler);
app.post('/users', handler);

// Compile (freezes route structure, enables optimizations)
app.compile();

// Start server
app.listen(3000);
```

This step:
- Freezes the router structure (prevents shape changes)
- Precomputes route matchers
- Enables V8 inline caching
- **Optional but highly recommended for production**

### 3. Request/Response Objects

The req and res objects are lightweight wrappers:

```javascript
// Access native Node.js objects
app.get('/', (req, res) => {
  req.raw // IncomingMessage
  res.raw // ServerResponse

  // Express-compatible helpers still work
  req.params
  req.query
  req.get('header')

  res.json({})
  res.send('')
  res.status(200)
});
```

## API Compatibility Matrix

### ✅ Fully Supported

| Feature | Express 4.x | @express/core |
|---------|-------------|---------------|
| `app.get/post/put/delete()` | ✅ | ✅ |
| `app.use()` | ✅ | ✅ |
| `app.listen()` | ✅ | ✅ |
| Route parameters (`:id`) | ✅ | ✅ |
| Middleware chain | ✅ | ✅ |
| `req.params` | ✅ | ✅ |
| `req.query` | ✅ | ✅ |
| `req.get()` | ✅ | ✅ |
| `res.json()` | ✅ | ✅ |
| `res.send()` | ✅ | ✅ |
| `res.status()` | ✅ | ✅ |
| `res.redirect()` | ✅ | ✅ |
| Error handling | ✅ | ✅ |

### ⚠️ Different Implementation

| Feature | Express 4.x | @express/core | Notes |
|---------|-------------|---------------|-------|
| `app.set/get()` | ✅ | ✅ | Settings stored differently |
| `req.body` | ✅ (with middleware) | ✅ (with middleware) | Not built-in |
| Template rendering | ✅ | ❌ | Use external renderer |

### ❌ Not Supported

| Feature | Reason | Alternative |
|---------|--------|-------------|
| `app.engine()` | View engines external | Use standalone renderer |
| `app.render()` | View engines external | Use standalone renderer |
| Sub-applications | Complexity/performance | Use routers |

## Migration Steps

### Step 1: Update Dependencies

```json
{
  "dependencies": {
    "@express/core": "^5.0.0"
  }
}
```

### Step 2: Convert to ESM

**Option A: Use ESM**
```json
{
  "type": "module"
}
```

**Option B: Use .mjs extension**
```bash
mv app.js app.mjs
```

### Step 3: Update Imports

```javascript
// Before
const express = require('express');
const app = express();

// After
import { createApp } from '@express/core';
const app = createApp();
```

### Step 4: Add Compilation

```javascript
// After all route registration
app.compile();
app.listen(3000);
```

### Step 5: Test

```bash
node app.js
```

## Performance Tuning

### 1. Enable Compilation

Always call `compile()` in production:

```javascript
if (process.env.NODE_ENV === 'production') {
  app.compile();
}
app.listen(3000);
```

### 2. Use Sync Pipeline (if possible)

If all middleware is synchronous, use the sync pipeline:

```javascript
import { createApp } from '@express/core';

const app = createApp({
  syncOnly: true // Experimental flag
});
```

### 3. Minimize Middleware

Each middleware adds overhead. Combine where possible:

```javascript
// Before: Multiple middleware
app.use(logger);
app.use(cors);
app.use(helmet);

// After: Combined
app.use((req, res, next) => {
  logger(req, res, () => {
    cors(req, res, () => {
      helmet(req, res, next);
    });
  });
});
```

### 4. Use Native Headers

Lowercase header names are faster:

```javascript
// Slower
res.set('Content-Type', 'application/json');

// Faster
res.set('content-type', 'application/json');
```

### 5. Avoid Dynamic Routes

Register routes at startup, not dynamically:

```javascript
// ❌ Don't do this
app.get('/dynamic', (req, res) => {
  app.get('/another-route', handler); // Dynamic!
  res.send('ok');
});

// ✅ Do this
app.get('/dynamic', handler1);
app.get('/another-route', handler2);
```

## Compatibility Layer

For gradual migration, use `@express/compat`:

```javascript
import express from '@express/compat';

// Works like Express 4.x but uses new engine
const app = express();

app.get('/', (req, res) => {
  res.send('Compatible!');
});

app.listen(3000);
```

## Common Issues

### Issue: `require() not supported`

**Solution:** Switch to ESM or use the compat package.

### Issue: `req.body is undefined`

**Solution:** Add body parser middleware (not built-in).

```javascript
import bodyParser from 'body-parser';
app.use(bodyParser.json());
```

### Issue: Routes not matching

**Solution:** Ensure `compile()` is called after all routes are registered.

### Issue: Lower performance than expected

**Solution:** Check:
1. Called `app.compile()`?
2. Running in production mode?
3. Using latest Node.js LTS?

## Benchmarking Your App

Compare before and after:

```bash
# Express 4.x
autocannon -c 100 -d 30 http://localhost:3000

# @express/core
autocannon -c 100 -d 30 http://localhost:3001
```

## Support

- GitHub Issues: https://github.com/resillix/racejs/issues
- Discussions: https://github.com/resillix/racejs/discussions
- Documentation: https://github.com/resillix/racejs
- Email: dhananjaylatpate@resillix.com

## Next Steps

- Read the [Performance Tuning Guide](./performance.md)
- Check out [Examples](../examples/)
- Review the [API Reference](./api.md)
