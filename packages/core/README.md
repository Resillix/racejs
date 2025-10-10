# @racejs/core

⚡️ High-performance core engine for RaceJS framework - An ultra-fast, Express-compatible Node.js web framework built for performance.

## Features

- 🚀 **Blazing Fast**: Optimized router and middleware system
- 🔄 **Hot Reload**: Smart hot reload with zero downtime (development & production)
- 🔌 **Express Compatible**: Drop-in replacement for Express 4.x (use with @racejs/compat)
- 📦 **Zero Dependencies**: Minimal footprint (optional: @parcel/watcher for better hot reload)
- 🎯 **Modern API**: Built with TypeScript, async/await first
- ⚙️ **Advanced Features**: Native file watching, route swapping, graceful shutdown

## Installation

```bash
npm install @racejs/core
```

## Quick Start

```javascript
import { createRaceApp } from '@racejs/core';

const app = createRaceApp();

app.get('/', (req, res) => {
  res.json({ message: 'Hello from RaceJS!' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Hot Reload

Enable hot reload for zero-downtime development:

```javascript
import { createRaceApp } from '@racejs/core';

const app = createRaceApp({
  hotReload: {
    enabled: true,
    watch: ['./routes', './middleware'],
  },
});
```

## Documentation

- [Full Documentation](https://github.com/resillix/racejs#readme)
- [Hot Reload Guide](https://github.com/resillix/racejs/blob/master/docs/guides/HOT-RELOAD.md)
- [Migration Guide](https://github.com/resillix/racejs/blob/master/docs/migration.md)
- [Examples](https://github.com/resillix/racejs/tree/master/examples)

## Express Compatibility

For Express 4.x compatibility, use `@racejs/compat`:

```bash
npm install @racejs/compat
```

See [@racejs/compat](https://www.npmjs.com/package/@racejs/compat) for details.

## Performance

RaceJS delivers exceptional performance:

- **3-5x faster** routing than Express
- **Zero overhead** middleware system
- **Optimized** for modern Node.js (18+)

## License

MIT © [Resillix](https://github.com/resillix)

## Links

- [GitHub Repository](https://github.com/resillix/racejs)
- [Documentation](https://github.com/resillix/racejs#readme)
- [Issues](https://github.com/resillix/racejs/issues)
- [Contributing Guide](https://github.com/resillix/racejs/blob/master/CONTRIBUTING.md)
