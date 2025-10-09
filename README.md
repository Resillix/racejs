# ⚡️ RaceJS

> Ultra-fast, Express-compatible Node.js web framework built for maximum performance

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

**RaceJS** is a high-performance web framework for Node.js, designed and developed by [Resillix](https://resillix.com), a software startup focused on building cutting-edge developer tools.

## 🚀 Why RaceJS?

- **⚡️ Blazing Fast**: 2-3x faster than Express.js with optimized routing and middleware
- **� Built-in Hot Reload**: Zero-config hot reload in development—just like Next.js!
- **�🔄 Drop-in Replacement**: 90%+ Express 4.x API compatibility
- **🎯 Zero-Cost Middleware**: Pre-bound `next()` functions eliminate closure allocations
- **🌲 Radix Trie Router**: O(k) lookup complexity for lightning-fast route matching
- **💪 TypeScript First**: Built with TypeScript for excellent developer experience
- **🔧 Production Ready**: Battle-tested architecture with comprehensive test coverage

## 📊 Performance

RaceJS significantly outperforms Express.js:

| Route Type                  | RaceJS (req/s) | Express 4.x | Improvement   |
| --------------------------- | -------------- | ----------- | ------------- |
| Static (`/ping`)            | ~11,000        | ~5,500      | **2x faster** |
| Parameterized (`/user/:id`) | ~19,000        | ~4,800      | **4x faster** |
| POST requests               | ~19,500        | ~4,700      | **4x faster** |

_Benchmarks run on Node.js v20 with sequential HTTP requests_

## 📦 Installation

```bash
npm install racejs
# or
pnpm add racejs
# or
yarn add racejs
```

## 🎯 Quick Start

### Using RaceJS (Native API)

```javascript
import { createApp } from '@racejs/core';

const app = createApp();

// Define routes
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from RaceJS!' });
});

app.get('/user/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

// Compile routes for optimal performance
app.compile();

// Start server (hot reload automatically enabled in development!)
app.listen(3000, () => {
  console.log('🏁 RaceJS server running on http://localhost:3000');
  console.log('🔥 Hot reload active - edit your code and see instant updates!');
});
```

### Express Compatibility Mode

Already have an Express app? Use the compatibility layer:

```javascript
import express from '@racejs/compat';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000);
```

## 🏗️ Architecture

RaceJS is built on three core optimizations:

### 1. **Radix Trie Router**

- O(k) lookup complexity (k = path length)
- Efficient parameter extraction
- Static, parameterized, and wildcard route support

### 2. **Zero-Cost Middleware Pipeline**

- Pre-bound `next()` functions
- Minimal allocations in hot path
- Async/await support with zero overhead

### 3. **Lazy Request Parsing**

- Query strings parsed on-demand
- Cached parsed results
- Minimal memory footprint

### 4. **Built-in Hot Reload** 🔥

RaceJS includes professional hot reload out of the box—no configuration needed!

```javascript
const app = createApp();
// That's it! Hot reload works automatically in development
```

**Features:**
- ✅ **Zero Config**: Auto-enabled in development mode
- ✅ **Smart Detection**: Automatically finds your route directories
- ✅ **Zero Downtime**: Route handlers swap atomically
- ✅ **Production Safe**: Automatically disabled in production
- ✅ **Instant Feedback**: See changes without restarting server
- 🚀 **@parcel/watcher Support**: Optional native file watcher for better performance

Edit your code, save, and see changes instantly—just like Next.js, Vite, or Remix!

**Learn more:**
- 📖 [Complete Hot Reload Guide](./docs/guides/HOT-RELOAD.md)
- 🛠️ [Developer API](./docs/guides/hot-reload-developer-guide.md)
- ⚡ [@parcel/watcher Setup](./docs/advanced/parcel-watcher-guide.md)

## 📚 Documentation

- [Getting Started Guide](./docs/getting-started.md)
- [API Reference](./docs/api.md)
- [Migration from Express](./docs/migration.md)
- [Performance Tuning](./docs/performance.md)
- [Architecture Deep Dive](./docs/architecture.md)
- [Hot Reload — Developer Guide](./docs/hot-reload-developer-guide.md)

## 🔧 API Overview

### Application Methods

```javascript
const app = createApp(options);

// HTTP methods
app.get(path, ...handlers);
app.post(path, ...handlers);
app.put(path, ...handlers);
app.delete(path, ...handlers);
app.patch(path, ...handlers);
app.all(path, ...handlers);

// Middleware
app.use(...handlers);

// Settings
app.set(name, value);
app.getSetting(name);

// Compile routes (recommended before listen)
app.compile();

// Start server
app.listen(port, callback);
```

### Request Object

```javascript
req.method; // HTTP method
req.url; // Request URL
req.params; // Route parameters
req.query; // Query string (lazy-parsed)
req.path; // Request path
req.hostname; // Hostname
req.ip; // Client IP
```

### Response Object

```javascript
res.json(data); // Send JSON
res.send(data); // Send response
res.status(code); // Set status code
res.set(name, value); // Set header
res.cookie(name, value); // Set cookie
res.redirect(url); // Redirect
res.type(type); // Set Content-Type
```

## 🔄 Migrating from Express

RaceJS provides 90%+ API compatibility with Express 4.x:

```javascript
// Before (Express)
const express = require('express');
const app = express();

// After (RaceJS - Option 1: Compat Layer)
import express from '@racejs/compat';
const app = express();

// After (RaceJS - Option 2: Native)
import { createApp } from '@racejs/core';
const app = createApp();
app.compile(); // Add this for optimal performance
```

See the [Migration Guide](./docs/migration.md) for details.

## 🧪 Testing

```bash
# Run test suite
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific tests
pnpm test -- --grep "Router"
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## 📄 License

MIT © [Dhananjay Latpate](mailto:dhananjaylatpate@resillix.com)

## 👨‍💻 Author

**Dhananjay Latpate**

- 📧 Email: dhananjaylatpate@resillix.com
- 🏢 Company: [Resillix](https://resillix.com)
- 💼 GitHub: [@resillix](https://github.com/resillix)

## 🏢 About Resillix

RaceJS is developed and maintained by [Resillix](https://resillix.com), a software startup building next-generation developer tools. We're passionate about performance, developer experience, and open source.

## 🚀 Growth Strategy

Interested in how we plan to grow RaceJS into a global framework? Check out our comprehensive [Growth Strategy](./GROWTH-STRATEGY.md) to see how we're building a worldwide community of contributors and users.

---

**Built with ⚡️ by [Dhananjay Latpate](mailto:dhananjaylatpate@resillix.com) and the RaceJS community**

- 🌐 Website: [resillix.com](https://resillix.com)
- 📧 Email: contact@resillix.com
- 💼 GitHub: [@resillix](https://github.com/resillix)
