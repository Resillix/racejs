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

### Advanced

- [@parcel/watcher Integration](./advanced/parcel-watcher-guide.md) - Native file watching setup

## 🚀 Quick Links

### Most Popular

1. **[Hot Reload Guide](./guides/HOT-RELOAD.md)** - Edit code, save, see changes instantly!
2. **[Architecture](./architecture.md)** - Understand how RaceJS works
3. **[Migration Guide](./migration.md)** - Switch from Express.js

### Key Features

- ⚡ **High Performance** - Optimized routing and middleware
- 🔥 **Zero-Downtime Hot Reload** - Edit without restarting
- 🔄 **Express Compatible** - Drop-in replacement
- 📦 **Lightweight** - Minimal dependencies
- 🛠️ **TypeScript Ready** - Full type definitions

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

### Features

- [Hot Reload](./guides/HOT-RELOAD.md)
  - [Quick Start](./guides/HOT-RELOAD.md#quick-start)
  - [Configuration](./guides/HOT-RELOAD.md#configuration)
  - [Best Practices](./guides/HOT-RELOAD.md#best-practices)
  - [Troubleshooting](./guides/HOT-RELOAD.md#troubleshooting)

### Advanced Topics

- [@parcel/watcher Setup](./advanced/parcel-watcher-guide.md)
- [Performance Optimization](./performance.md)
- [Developer API](./guides/hot-reload-developer-guide.md)

### Migration

- [From Express.js](./migration.md)
- [API Compatibility](./migration.md#compatibility)

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📝 License

MIT - See [LICENSE](../LICENSE)

---

**Need help?** Check out our [examples](../examples/) or open an issue!
