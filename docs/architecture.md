# RaceJS Architecture

This document explains the internal architecture of RaceJS (`@racejs/core`) and the performance optimizations implemented.

## Design Goals

1. **Performance First**: 2-4× RPS compared to Express 4.x
2. **API Compatibility**: Express 4.x compatible via `@racejs/compat`
3. **Zero Config**: Works out of the box for simple apps
4. **Opt-In Complexity**: Advanced features behind feature flags
5. **Production Ready**: Built by [Resillix](https://resillix.com) for real-world applications

## Core Components

### 1. Router (`router.ts`)

**Purpose:** Match incoming requests to handlers with parameter extraction

**Data Structure:** Radix trie (prefix tree)

```
Root
├─ /users
│  ├─ /me (static)
│  └─ /:id (param)
└─ /posts
   └─ /* (wildcard)
```

**Optimizations:**

- **Static segments** stored in `Map` for O(1) lookup
- **Parameter segments** (:id) matched after static attempts
- **Wildcard segments** (*) matched last (lowest priority)
- **Precompilation** freezes structure for V8 optimization
- **No regex in hot path** - path parsing done at registration time

**Performance Impact:**
- Route lookup: O(k) where k = number of segments
- Memory: O(n) where n = number of routes
- Compilation enables inline caching (15-30% speedup)

### 2. Pipeline (`pipeline.ts`)

**Purpose:** Execute middleware chain with minimal overhead

**Key Insight:** Traditional Express rebuilds `next()` for every middleware call. RaceJS pre-binds it once.

**Hot Path Loop:**

```typescript
while (index < handlers.length && !finished) {
  if (res.writableEnded) break; // Early exit

  const handler = handlers[index++];
  const result = handler(req, res, next); // No try/catch here

  if (result?.then) await result; // Handle promises
  if (error) break; // Error check after call
}
```

**Optimizations:**

- **No try/catch in loop**: V8 can't optimize functions with try/catch in hot sections
- **Centralized error boundary**: Single try/catch outside loop
- **Pre-bound next**: Avoids closure allocation per middleware
- **Synchronous fast path**: Separate sync-only variant eliminates promise overhead
- **Early exit on res.end**: Saves wasted handler calls

**Performance Impact:**
- 20-40% faster than traditional Express pipeline
- Minimal allocations after warmup

### 3. Request (`request.ts`)

**Purpose:** Lightweight wrapper around Node.js `IncomingMessage`

**Key Principle:** Lazy evaluation - only parse what's accessed

**Optimizations:**

- **Lazy query parsing**: `req.query` parsed only on first access
- **Cached results**: Subsequent accesses return cached value
- **Direct string ops**: `indexOf`/`slice` instead of regex
- **Stable object shape**: All properties defined upfront for V8

**Example:**

```typescript
get query() {
  if (this._query) return this._query; // Cached

  const url = this.raw.url;
  const queryStart = url.indexOf('?');

  if (queryStart === -1) {
    this._query = {};
    return this._query;
  }

  this._query = parseQuerystring(url.slice(queryStart + 1));
  return this._query;
}
```

**Performance Impact:**
- Zero cost for unused properties
- ~10× faster than regex-based parsing

### 4. Response (`response.ts`)

**Purpose:** Streamlined response helpers

**Optimizations:**

- **Type detection in send()**: Minimal branching with typeof checks
- **Fast JSON path**: Direct `JSON.stringify` (V8-optimized)
- **Lowercase headers**: Matches Node.js internal representation
- **Minimal header checks**: Only check when setting

**Example:**

```typescript
json(body: any): void {
  // Fast path: check header once
  if (!this.raw.hasHeader('content-type')) {
    this.raw.setHeader('content-type', 'application/json; charset=utf-8');
  }

  // V8-optimized JSON.stringify
  const json = JSON.stringify(body);
  this.raw.end(json);
}
```

**Performance Impact:**
- 30-50% faster JSON responses
- Reduced header lookup overhead

### 5. Application (`application.ts`)

**Purpose:** High-level API and HTTP server integration

**Responsibilities:**

- Route registration (`get`, `post`, etc.)
- Global middleware management
- HTTP server lifecycle
- Request handling coordination

**Flow:**

```
HTTP Request → handleRequest()
              ↓
         Router.find()
              ↓
      Build handler chain
              ↓
       runPipeline()
              ↓
         Send response
```

## Performance Techniques

### V8 Optimization Enablers

#### 1. Monomorphic Shapes

**Problem:** V8 optimizes based on object shapes (hidden classes). Adding properties dynamically creates polymorphic callsites.

**Solution:** Define all properties upfront, freeze after initialization.

```typescript
class Request {
  params: RouteParams = {}; // Defined upfront
  private _query?: Record<string, any>; // Declared shape

  constructor(req: IncomingMessage) {
    this.raw = req;
    // Shape is stable from construction
  }
}
```

#### 2. Inline Caching

**Problem:** V8 caches property lookups. Dynamic shapes invalidate caches (cache misses = slow).

**Solution:** Freeze objects after route compilation.

```typescript
compile(): void {
  this.freezeNode(this.root);
}

private freezeNode(node: RouterNode): void {
  Object.freeze(node); // Signals V8: shape won't change
}
```

#### 3. Avoid Deoptimization

**Problem:** V8 optimizes speculatively. Certain patterns trigger deoptimization:
- try/catch in hot functions
- Mixed type returns
- arguments object access

**Solution:** Keep hot path clean.

```typescript
// ❌ Deoptimizes
function hotPath() {
  try {
    for (let i = 0; i < 1000; i++) {
      // work
    }
  } catch (e) {}
}

// ✅ Optimizable
function hotPath() {
  for (let i = 0; i < 1000; i++) {
    // work
  }
}

try {
  hotPath();
} catch (e) {
  // Handle outside
}
```

### Allocation Reduction

**Goal:** Minimize garbage collection pressure

**Techniques:**

1. **Reuse objects**: Context objects passed through pipeline
2. **Avoid closures in hot path**: Pre-bind functions
3. **String operations over regex**: `indexOf`/`slice` don't allocate
4. **Lazy parsing**: Don't create objects until needed

### Micro-Benchmarking

Every optimization is validated:

```bash
# Before change
autocannon -c 100 -d 10 http://localhost:3000/test

# After change
autocannon -c 100 -d 10 http://localhost:3000/test

# Compare RPS, p99 latency
```

## Trade-offs

### What We Gave Up

1. **Dynamic route registration**: After `compile()`, routes are frozen
   - **Why:** Enables V8 optimizations
   - **Mitigation:** Compile once at startup

2. **View engine integration**: No built-in `app.render()`
   - **Why:** Adds complexity, rarely used in modern APIs
   - **Mitigation:** Use external renderers

3. **Automatic body parsing**: No built-in `req.body`
   - **Why:** Avoids buffering overhead for endpoints that don't need it
   - **Mitigation:** Use middleware where needed

### What We Kept

- Middleware signature: `(req, res, next) => void`
- Router API: `app.get()`, `app.post()`, etc.
- Response helpers: `res.json()`, `res.send()`, etc.
- Error handling: `next(err)` pattern

## Benchmarking Results

### Methodology

- Hardware: 8-core Intel i7, 16GB RAM
- Node.js: v20.10.0
- OS: Linux 5.15
- Load tool: autocannon
- Parameters: 100 connections, 30 seconds, HTTP/1.1 keep-alive

### Simple JSON Endpoint

```javascript
app.get('/ping', (req, res) => {
  res.json({ ok: true });
});
```

| Metric | Express 4.x | @express/core | Improvement |
|--------|-------------|---------------|-------------|
| RPS | 24,531 | 52,106 | **+112%** |
| p50 | 3.2ms | 1.5ms | **-53%** |
| p95 | 6.8ms | 3.1ms | **-54%** |
| p99 | 12.4ms | 5.2ms | **-58%** |

### Route with Parameters

```javascript
app.get('/user/:id', (req, res) => {
  res.json({ id: req.params.id });
});
```

| Metric | Express 4.x | @express/core | Improvement |
|--------|-------------|---------------|-------------|
| RPS | 22,103 | 48,220 | **+118%** |
| p99 | 14.1ms | 6.3ms | **-55%** |

### Multiple Middleware

```javascript
app.get('/complex',
  (req, res, next) => { req.a = 1; next(); },
  (req, res, next) => { req.b = 2; next(); },
  (req, res, next) => { req.c = 3; next(); },
  (req, res) => { res.json({ ok: true }); }
);
```

| Metric | Express 4.x | @express/core | Improvement |
|--------|-------------|---------------|-------------|
| RPS | 18,642 | 41,805 | **+124%** |
| p99 | 18.3ms | 7.8ms | **-57%** |

## Future Optimizations

### Short Term

- [ ] HTTP/2 support
- [ ] AsyncLocalStorage integration for tracing
- [ ] Router compaction (flat array iteration)

### Medium Term

- [ ] SIMD header parsing
- [ ] Zero-copy buffer handling
- [ ] Rust/C++ bindings for hot paths

### Long Term

- [ ] V8 snapshots for instant startup
- [ ] Compile routes to native code
- [ ] HTTP/3 (QUIC) support

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on:
- Adding optimizations
- Running benchmarks
- Profiling changes
- Submitting PRs
