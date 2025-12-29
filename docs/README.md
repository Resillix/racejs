# RaceJS Documentation

Welcome to the RaceJS documentation! RaceJS is a high-performance Node.js web framework built for speed and developer productivity.

## 📚 Documentation Structure

### Getting Started

- [Main README](../README.md) - Overview and quick start
- [Architecture](./architecture.md) - Framework architecture and design
- [Migration Guide](./migration.md) - Migrating from Express.js

### Guides

- [Hot Reload](./guides/HOT-RELOAD.md) - **Zero-downtime development with automatic reloads**
- [Hot Reload Developer Guide](./guides/hot-reload-developer-guide.md) - Advanced hot reload integration
- [Performance](./performance.md) - Performance tuning and optimization
- **[Dev Mode Analysis](./dev-mode-analysis.md)** - **Complete guide to RaceJS developer tools**

### Framework Comparisons

- **[RaceJS vs Next.js](./nextjs-comparison.md)** - **When to use RaceJS vs Next.js**

### Advanced

- [@parcel/watcher Integration](./advanced/parcel-watcher-guide.md) - Native file watching setup

## 🚀 Quick Links

### Most Popular

1. **[Dev Mode Analysis](./dev-mode-analysis.md)** - **Complete developer tools guide**
2. **[Hot Reload Guide](./guides/HOT-RELOAD.md)** - Edit code, save, see changes instantly!
3. **[RaceJS vs Next.js](./nextjs-comparison.md)** - **Framework comparison**
4. **[Architecture](./architecture.md)** - Understand how RaceJS works
5. **[Migration Guide](./migration.md)** - Switch from Express.js

### Key Features

- ⚡ **High Performance** - 2-4x faster than Express, optimized routing
- 🔥 **Zero-Downtime Hot Reload** - Edit without restarting
- 🔧 **Advanced Dev Mode** - Time-travel debugging, profiling, error intelligence
- 🔄 **Express Compatible** - Drop-in replacement with 90%+ API compatibility
- 📦 **Lightweight** - Minimal dependencies, ~30MB memory footprint
- 🛠️ **TypeScript Ready** - Full type definitions and excellent DX

## 🎯 Feature Highlights

### Hot Reload (New!)

```javascript
const { createApp } = require('@racejs/core');

const app = createApp(); // Hot reload auto-enabled!

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.compile();
app.listen(3000);

// Edit the route, save - it reloads in < 20ms! 🔥
```

See: **[Hot Reload Documentation](./guides/HOT-RELOAD.md)**

### Express Compatibility

```javascript
// Works with existing Express code!
const { createExpressApp } = require('@racejs/compat');

const app = createExpressApp();
// Use all your Express middleware and routes
```

See: **[Migration Guide](./migration.md)**

## 📖 Documentation Index

### Core Concepts

- [Architecture Overview](./architecture.md)
- [Request Lifecycle](./architecture.md#request-lifecycle)
- [Routing System](./architecture.md#routing)
- [Middleware](./architecture.md#middleware)

### Developer Experience

- **[Dev Mode Complete Analysis](./dev-mode-analysis.md)** - Comprehensive guide to all dev tools
  - [Logger](./dev-mode-analysis.md#1-zero-config-dev-logger)
  - [Request Recording & Time-Travel](./dev-mode-analysis.md#2-request-recorder--time-travel-debugging)
  - [Performance Profiler](./dev-mode-analysis.md#3-performance-profiler)
  - [Error Intelligence](./dev-mode-analysis.md#4-error-handler--intelligence)
  - [DevTools Browser UI](./dev-mode-analysis.md#5-devtools-browser-ui)
- **[Dev Mode Usage Guide](./dev-mode-usage-guide.md)** - Step-by-step practical guide
  - [Quick Start](./dev-mode-usage-guide.md#quick-start)
  - [Request Recording & Time-Travel](./dev-mode-usage-guide.md#request-recording--time-travel-debugging)
  - [Performance Profiling](./dev-mode-usage-guide.md#performance-profiling)
  - [Error Intelligence](./dev-mode-usage-guide.md#error-intelligence)
  - [Integration Examples](./dev-mode-usage-guide.md#integration-examples)
  - [Troubleshooting](./dev-mode-usage-guide.md#troubleshooting)
- [Hot Reload](./guides/HOT-RELOAD.md)
  - [Quick Start](./guides/HOT-RELOAD.md#quick-start)
  - [Configuration](./guides/HOT-RELOAD.md#configuration)
  - [Best Practices](./guides/HOT-RELOAD.md#best-practices)
  - [Troubleshooting](./guides/HOT-RELOAD.md#troubleshooting)

### Framework Comparisons

- **[RaceJS vs Next.js](./nextjs-comparison.md)** - Complete comparison
  - [When to Use RaceJS](./nextjs-comparison.md#use-racejs-when)
  - [When to Use Next.js](./nextjs-comparison.md#use-nextjs-when)
  - [Feature Comparison](./nextjs-comparison.md#-feature-comparison-matrix)
  - [Performance Benchmarks](./nextjs-comparison.md#-performance-benchmarks)
  - [Use Case Analysis](./nextjs-comparison.md#-use-case-analysis)
  - [Migration Guides](./nextjs-comparison.md#-migration-guides)

### Advanced Topics

- [@parcel/watcher Setup](./advanced/parcel-watcher-guide.md)
- [Performance Optimization](./performance.md)
- [Developer API](./guides/hot-reload-developer-guide.md)

### Migration

- [From Express.js](./migration.md)
- [From Next.js API Routes](./nextjs-comparison.md#migrating-from-nextjs-api-routes-to-racejs)
- [API Compatibility](./migration.md#compatibility)

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📝 License

MIT - See [LICENSE](../LICENSE)

---

**Need help?** Check out our [examples](../examples/) or open an issue!
