# Changelog

All notable changes to RaceJS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Smart Hot Reload** - Zero-downtime automatic code reloading
  - Built-in hot reload system with zero configuration
  - Native file watching via @parcel/watcher (optional)
  - Automatic module cache clearing and route swapping
  - Intelligent dependency tracking and change detection
  - Sub-20ms reload times with @parcel/watcher
  - Graceful fallback to fs.watch and polling
  - Comprehensive console feedback and logging
  - Auto-detection of route directories
  - Development mode auto-enable
  - Full TypeScript support

### Changed

- Enhanced Application class with built-in hot reload support
- Extended Router with hot-swap capabilities
- Improved error handling and recovery

### Performance

- Hot reload: < 20ms with @parcel/watcher
- Hot reload: ~60ms with fs.watch fallback
- Zero overhead when disabled (production)
- Minimal memory footprint (~5MB for watcher)

## [1.0.0] - Previous Release

### Added

- Initial RaceJS release
- High-performance routing system
- Express.js compatibility layer
- Middleware support
- Request/response API
- Static file serving
- Template engine support

### Features

- Fast routing with optimized path matching
- Express-compatible API
- Lightweight core (~minimal dependencies)
- TypeScript definitions
- Comprehensive test suite

---

## Version History

### Semantic Versioning

RaceJS follows semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR** - Incompatible API changes
- **MINOR** - New functionality (backward-compatible)
- **PATCH** - Bug fixes (backward-compatible)

### Release Types

- **Stable** - Production-ready releases (1.x.x)
- **Beta** - Feature-complete, testing phase (1.x.x-beta.x)
- **Alpha** - Early development, unstable (1.x.x-alpha.x)

---

## Migration Notes

### Upgrading to Hot Reload Version

**No breaking changes!** Hot reload is opt-in via auto-detection:

```javascript
// Before (still works)
const { createApp } = require('@racejs/core');
const app = createApp();

// After (hot reload auto-enabled in development)
const { createApp } = require('@racejs/core');
const app = createApp(); // That's it! Hot reload works automatically
```

To disable hot reload:

```javascript
const app = createApp({ hotReload: false });
```

### New Dependencies

**Optional:**

- `@parcel/watcher` - Native file watcher (recommended for best performance)

If not installed, RaceJS automatically falls back to Node.js `fs.watch`.

---

## Roadmap

### Planned Features

#### v1.1.0 (Current - Hot Reload)

- [x] Smart Hot Reload system
- [x] @parcel/watcher integration
- [x] Zero-downtime reloading
- [x] Built-in developer tooling
- [x] Comprehensive documentation

#### v1.2.0 (Future)

- [ ] WebSocket support for live reload notifications
- [ ] Source map support for better error reporting
- [ ] Dependency graph visualization
- [ ] Performance profiling tools
- [ ] Hot reload for middleware changes

#### v1.3.0 (Future)

- [ ] Plugin system
- [ ] Extended template engine support
- [ ] Built-in API documentation generator
- [ ] Development dashboard
- [ ] Enhanced debugging tools

#### v2.0.0 (Future - Breaking Changes)

- [ ] Full HTTP/2 support
- [ ] Enhanced streaming capabilities
- [ ] Modernized middleware system
- [ ] Performance optimizations

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Reporting bugs
- Suggesting features
- Submitting pull requests
- Code style guidelines

---

## Support

- **Documentation:** [docs/](./docs/)
- **Examples:** [examples/](./examples/)
- **Issues:** [GitHub Issues](https://github.com/Resillix/racejs/issues)

---

**Thank you for using RaceJS!** 🚀
