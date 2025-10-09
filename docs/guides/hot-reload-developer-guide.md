# RaceJS Hot Reload — Developer Guide

This guide explains how to use and extend the Smart Hot Reload system while working on RaceJS or apps built with it.

## 🚀 Built-in Hot Reload (Recommended)

**Zero configuration required!** RaceJS includes professional built-in hot reload that works automatically in development mode—just like Next.js, Vite, and other modern frameworks.

### File Watching Backend

RaceJS automatically selects the best available file watcher:
- **🚀 @parcel/watcher** (preferred): Native C++ addon used by Parcel, Turbopack - install with `npm install @parcel/watcher`
- **📁 fs.watch** (fallback): Node.js built-in - works everywhere but less reliable on some platforms

See [Parcel Watcher Guide](./parcel-watcher-guide.md) for details.

### Quick Start

```javascript
const { createApp } = require('@racejs/core');

const app = createApp();

// Register your routes
app.get('/users', (req, res) => {
  res.json({ users: [] });
});

// Start server - hot reload is automatically enabled in development!
app.listen(3000, () => {
  console.log('Server running with built-in hot reload!');
});
```

**That's it!** Hot reload is automatically:
- ✅ Enabled in development (`NODE_ENV !== 'production'`)
- ✅ Watching common directories (`routes/`, `src/routes/`, `api/`, etc.)
- ✅ Disabled in production for optimal performance
- ✅ Logging reload activity to console

### How It Works

1. **Auto-Detection**: Scans for common route directories:
   - `src/routes/`
   - `src/api/`
   - `routes/`
   - `api/`
   - `src/`
   - `lib/`

2. **Auto-Configuration**: Uses sensible defaults:
   - Watches first matching directory above
   - Ignores `node_modules/`, `.git/`, `dist/`
   - 75ms debounce, 120ms batch window
   - Logs changes in development

3. **Zero Downtime**: Route handlers swap atomically without dropping connections

### Custom Configuration (Optional)

```javascript
const app = createApp({
  hotReload: {
    enabled: true,
    roots: ['./my-routes', './my-api'], // Custom watch paths
    debounceMs: 100,
    batchMs: 150,
    ignore: ['**/*.test.js', '**/temp/**'],
  }
});
```

Disable explicitly:

```javascript
const app = createApp({
  hotReload: false // Opt-out if needed
});
```

### Route Module Format

For automatic route hot-swapping, export a `routes` array from your route modules:

```javascript
// routes/users.js
exports.routes = [
  { method: 'GET', path: '/users', handlers: [getUsersHandler] },
  { method: 'POST', path: '/users', handlers: [createUserHandler] },
];
```

### Example

See `examples/08-builtin-hot-reload/` for a complete working example with multiple route files.

---

## 🔧 Advanced: Manual HotReloadManager

For advanced use cases (custom orchestration, testing, programmatic control), you can use `HotReloadManager` directly.

### What's shipped

- File watcher: `packages/core/src/hot-reload/smart-watcher.ts`
- Module reloader: `packages/core/src/hot-reload/module-reloader.ts`
- Route swapper: `packages/core/src/hot-reload/route-swapper.ts`
- Orchestrator: `packages/core/src/hot-reload/manager.ts`
- Public exports: `@racejs/core` re-exports `SmartWatcher`, `ModuleReloader`, `RouteSwapper`, and `HotReloadManager`

### Manual Setup Example

```ts
import { Router, HotReloadManager } from '@racejs/core';
import path from 'node:path';

const router = new Router();
// ... register routes, then compile once
router.compile();

const mgr = new HotReloadManager({
  enabled: process.env.NODE_ENV !== 'production',
  roots: [path.resolve(process.cwd(), 'src/routes')],
  ignore: ['**/node_modules/**', '**/.git/**'],
});

mgr.setRouter(router);

mgr.on('reloading', ({ files }) => console.log('reloading', files));
mgr.on('reloaded', ({ duration }) => console.log('reloaded in', duration, 'ms'));
mgr.on('reload-error', ({ errors }) => console.error('reload error', errors?.[0]?.message));

mgr.start();
```

## Key APIs

- SmartWatcher
  - new SmartWatcher({ roots, ignore, debounceMs, batchMs, pollFallbackMs, hashMode, resolveDependencies })
  - Events: ready, change, batch, error
- ModuleReloader
  - reload(modulePath) → { success, module?, error? }
  - reloadMultiple(paths) preserves order and stops on first error
- RouteSwapper
  - swapRoutes(router, updates) where updates is Array<{ method, path, handlers }>
- HotReloadManager
  - new HotReloadManager(opts) — see options below
  - setRouter(router) — enables route hot swapping
  - Events: started, reloading, reloaded, reload-error, stopped

### HotReloadManager options

- enabled (default: NODE_ENV !== 'production')
- roots: string[] — directories to watch
- debounceMs (default: 75)
- batchMs (default: 120)
- pollFallbackMs (default: 0) — enable cross-platform polling sweep
- ignore: (string|RegExp)[] — glob-like patterns supported by the watcher

## Tuning & tips

- Debounce vs batch window: Lower values react faster, higher values reduce reload storms.
- Use pollFallbackMs on platforms with unreliable fs.watch to close gaps.
- Prefer smaller watch roots to minimize IO.
- For TypeScript projects, watch compiled output (e.g., dist/) in production.

## Testing

We added a small, focused suite:

- test/hot-reload/module-reloader.test.js — verifies reload after edits.
- test/hot-reload/route-swapper.test.js — validates handler hot-swapping.
- test/hot-reload/smart-watcher.test.js — validates ready and batching signals.

Run:

```bash
pnpm -w -r build
npm run test:hot-reload
```

## Troubleshooting

- No batch events:
  - Ensure files are under a configured roots directory and not ignored by patterns.
  - Increase batchMs slightly; some platforms coalesce events.
- Recompile errors about frozen nodes:
  - Router now skips freezing an already-frozen node; ensure you call router.compile() after batch updates only once.
- Routes not swapping:
  - Confirm your module exports routes (or default.routes).
  - Call setRouter(router) on the manager.

## Extending

- Custom dependency resolver: pass resolveDependencies to SmartWatcher to seed the reverse dependency graph for topological ordering.
- Alternative reload strategies: wrap ModuleReloader to instrument metrics or to support pre-load validation.

---

For deeper internals, see docs/hot-reload-implementation.md (architecture) and browse packages/core/src/hot-reload/\*.
