# Express to RaceJS Migration

This example shows how to migrate from Express to RaceJS, with two approaches:
1. **Express-compatible** - Use `@racejs/compat` for zero-code migration
2. **Native RaceJS** - Use `@racejs/core` for maximum performance

## Running

```bash
cd examples/05-express-migration

# Run Express-compatible version
npm run express-compat

# Run native RaceJS version
npm run native

# Run both (different ports)
npm run both
```

## Migration Strategies

### Strategy 1: Zero-Code Migration (Fastest)

Replace Express with `@racejs/compat` - **no code changes needed**:

```javascript
// Before (Express)
import express from 'express';

// After (RaceJS compatible)
import express from '@racejs/compat';
```

**Benefits:**
- ✅ Zero code changes
- ✅ 2-4× faster immediately
- ✅ 100% Express API compatibility
- ✅ All middleware works

**Result:** 2-4× performance boost with **zero effort**

### Strategy 2: Native Migration (Maximum Performance)

Migrate to native `@racejs/core` API for maximum performance:

```javascript
// Before (Express)
import express from 'express';
const app = express();

app.use(express.json());

app.post('/users', (req, res) => {
  // req.body already parsed
  res.json({ user: req.body });
});

// After (RaceJS native)
import { createApp } from '@racejs/core';
const app = createApp();

// No need for express.json() middleware

app.post('/users', async (req, res) => {
  // Parse on-demand (lazy)
  const body = await req.json();
  res.json({ user: body });
});

// Compile for optimal performance
app.compile();
```

**Changes needed:**
1. Import from `@racejs/core` instead of `express`
2. Use `createApp()` instead of `express()`
3. Call `await req.json()` instead of using `req.body`
4. Call `app.compile()` before `app.listen()`

**Benefits:**
- ⚡ Maximum performance (4-6× faster than Express)
- 📉 Lower memory usage
- 🚀 Lazy parsing (no overhead for unused data)
- 🎯 Optimized routing (O(k) instead of O(n))

## Feature Comparison

| Feature | Express | @racejs/compat | @racejs/core |
|---------|---------|----------------|--------------|
| Code changes | N/A | None | Minimal |
| Performance | 1× (baseline) | 2-4× | 4-6× |
| Memory usage | High | Medium | Low |
| API compatibility | 100% | 100% | 95% |
| Body parsing | Eager | Eager | Lazy |
| Route compilation | No | Yes | Yes |

## Testing Both Versions

### Test Express-compatible (port 3000)
```bash
curl http://localhost:3000/
curl http://localhost:3000/users/123
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'
```

### Test Native RaceJS (port 3001)
```bash
curl http://localhost:3001/
curl http://localhost:3001/users/123
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'
```

## Migration Checklist

### Phase 1: Quick Win (1 minute)
- [ ] Install `@racejs/compat`
- [ ] Change import: `import express from '@racejs/compat'`
- [ ] Test your application
- [ ] Deploy and enjoy 2-4× performance boost

### Phase 2: Optimization (1 hour)
- [ ] Install `@racejs/core`
- [ ] Change import: `import { createApp } from '@racejs/core'`
- [ ] Replace `express()` with `createApp()`
- [ ] Replace `req.body` with `await req.json()`
- [ ] Add `app.compile()` before `app.listen()`
- [ ] Test all routes
- [ ] Benchmark and verify 4-6× improvement

## Common Patterns

### Body Parsing
```javascript
// Express / @racejs/compat
app.use(express.json());
app.post('/data', (req, res) => {
  console.log(req.body); // Already parsed
});

// @racejs/core (lazy)
app.post('/data', async (req, res) => {
  const body = await req.json(); // Parse on-demand
  console.log(body);
});
```

### Error Handling
```javascript
// Same in all versions
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

### Middleware
```javascript
// Same in all versions
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});
```

## When to Use Which?

**Use @racejs/compat when:**
- You want instant performance gains
- You have a large Express codebase
- You need 100% compatibility
- You want zero migration effort

**Use @racejs/core when:**
- You're building a new application
- You need maximum performance
- You want lowest memory usage
- You can afford minimal code changes

## Recommended Approach

1. **Start with @racejs/compat** - Get immediate 2-4× boost
2. **Identify bottlenecks** - Profile your application
3. **Gradually migrate** hot paths to @racejs/core
4. **Hybrid approach** - Use both packages together!

```javascript
import { createApp } from '@racejs/core';
import express from '@racejs/compat';

const app = createApp();

// Use Express middleware when needed
app.use(express.json()); // Compat layer

// But use native routes for performance
app.get('/fast', (req, res) => {
  res.json({ ok: true }); // Native
});
```
