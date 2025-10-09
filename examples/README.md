# RaceJS Examples# RaceJS Examples

Complete examples demonstrating RaceJS features and capabilities.Welcome to the RaceJS examples! These examples demonstrate the features and capabilities of RaceJS, a high-performance web framework that's 2-4× faster than Express.

## 🚀 Quick Start## � Available Examples

Each example is a standalone application you can run immediately:### 1. [Hello World](./01-hello-world)

`````bash**Difficulty:** Beginner

cd examples/01-hello-world**Concepts:** Basic routing, JSON responses, app.compile()

node index.js

```The simplest RaceJS application. Learn the fundamentals:



Then visit http://localhost:3000- Creating an app

- Defining routes

## 📂 Examples Overview- Sending JSON responses

- Compiling for optimal performance

### 1. Hello World - `01-hello-world/`

The simplest RaceJS application. Start here!```bash

cd 01-hello-world && node index.js

### 2. REST API - `02-rest-api/````

Complete CRUD API with all HTTP methods.

### 2. [REST API](./02-rest-api)

### 3. Middleware - `03-middleware/`

Learn middleware patterns and chains.**Difficulty:** Beginner

**Concepts:** CRUD operations, route parameters, HTTP methods, body parsing

### 4. Performance - `04-performance/`

Optimization techniques and benchmarks.Build a complete TODO REST API with:



### 5. Express Migration - `05-express-migration/`- GET, POST, PUT, DELETE endpoints

Migrate from Express.js to RaceJS.- Route parameters (`:id`)

- Request body parsing

### 6. Advanced Patterns - `06-advanced-patterns/`- Error handling

Advanced routing and application patterns.- Logging middleware



### 7. Hot Reload 🔥 - `07-hot-reload/````bash

**Zero-downtime development! Edit code, save, see changes instantly!**cd 02-rest-api && node index.js

`````

## 🔥 Hot Reload - Must Try!

### 3. [Middleware](./03-middleware)

Example 07 demonstrates RaceJS's killer feature:

**Difficulty:** Intermediate

````bash**Concepts:** Global middleware, route middleware, authentication, validation

cd 07-hot-reload

node index.jsComprehensive middleware patterns:



# Edit any file in routes/ and save- Global middleware (logger, timing)

# ♻️  Reloading: filename.js- Authentication middleware

# ✅ Reloaded in 15ms- Rate limiting

# No restart needed!- Body validation

```- Multiple middleware chaining

- Error handling middleware

**Learn more:** [Hot Reload Guide](../docs/guides/HOT-RELOAD.md)

```bash

## 📖 Documentationcd 03-middleware && node index.js

````

- [Main README](../README.md)

- [Hot Reload](../docs/guides/HOT-RELOAD.md)### 4. [Performance Optimization](./04-performance)

- [Architecture](../docs/architecture.md)

- [All Docs](../docs/)**Difficulty:** Intermediate

**Concepts:** Route compilation, lazy parsing, streaming, compression

---

Maximize RaceJS performance with:

**Happy coding with RaceJS!** 🚀

- Route compilation (`app.compile()`)
- Lazy parsing optimization
- Streaming responses
- Gzip compression
- Performance monitoring
- Benchmarking

```bash
cd 04-performance && node index.js
```

### 5. [Express Migration](./05-express-migration)

**Difficulty:** Intermediate
**Concepts:** Express compatibility, migration strategies, API comparison

Learn how to migrate from Express:

- **Zero-code migration** with `@racejs/compat`
- **Native migration** to `@racejs/core`
- Side-by-side comparison
- Migration checklist
- Performance benchmarks

```bash
cd 05-express-migration && npm run express-compat
cd 05-express-migration && npm run native
```

### 6. [Advanced Patterns](./06-advanced-patterns)

**Difficulty:** Advanced
**Concepts:** Custom errors, async handlers, DI, validation, architecture

Production-ready patterns:

- Custom error classes
- Async error handling
- Dependency injection
- Context passing
- Validation middleware
- Structured logging
- Clean architecture

```bash
cd 06-advanced-patterns && node index.js
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Running Examples

```bash
# From the repository root
cd examples/<example-name>
node index.js

# Or with auto-reload
node --watch index.js
```

### Running All Examples

```bash
# Install dependencies (from repo root)
pnpm install

# Run any example
cd examples/01-hello-world
node index.js
```

## 📖 Learning Path

We recommend following this learning path:

1. **Start here:** [01-hello-world](./01-hello-world) - Learn the basics
2. **Build an API:** [02-rest-api](./02-rest-api) - CRUD operations
3. **Add middleware:** [03-middleware](./03-middleware) - Authentication, validation
4. **Optimize performance:** [04-performance](./04-performance) - Make it fast
5. **Migrate from Express:** [05-express-migration](./05-express-migration) - If you're coming from Express
6. **Production patterns:** [06-advanced-patterns](./06-advanced-patterns) - Best practices

## 🎯 Key Concepts

### RaceJS Native API (@racejs/core)

Maximum performance with the native API:

```javascript
import { createApp } from '@racejs/core';

const app = createApp();

app.get('/users', async (req, res) => {
  // Parse body only when needed (lazy parsing)
  const body = await req.json();
  res.json(body);
});

// Compile routes for O(k) lookup
app.compile();

app.listen(3000);
```

### Express Compatibility (@racejs/compat)

Drop-in Express replacement:

```javascript
import express from '@racejs/compat';

const app = express();

app.use(express.json());

app.get('/users', (req, res) => {
  // req.body already parsed (Express-compatible)
  res.json(req.body);
});

app.listen(3000);
```

## ⚡ Performance Comparison

| Framework       | Requests/sec | Latency (p99) |
| --------------- | ------------ | ------------- |
| Express 4.x     | ~30,000      | ~15ms         |
| RaceJS (compat) | ~60,000      | ~8ms          |
| RaceJS (native) | ~80,000      | ~4ms          |

_Benchmarked on M1 Mac, Node.js 22, simple JSON endpoint_

## 🔥 Key Features

- ⚡ **2-4× faster** than Express
- 🎯 **O(k) routing** with radix trie
- 🚀 **Lazy parsing** - no overhead for unused data
- 🔄 **100% Express compatible** with @racejs/compat
- 📦 **Zero dependencies** in core
- 🛠️ **TypeScript support** - Full type definitions
- 🎨 **Modern ESM** - Native ES modules

## 📚 Documentation

- [Main Documentation](../README.md)
- [Migration Guide](../docs/migration.md)
- [Performance Guide](../docs/performance.md)
- [Architecture](../docs/architecture.md)

## 🤝 Contributing

Found an issue or want to improve an example? Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

## 👨‍💻 Author

**Dhananjay Latpate**
Email: dhananjaylatpate@resillix.com
Organization: [Resillix](https://github.com/resillix)

## 🔗 Links

- [GitHub Repository](https://github.com/resillix/racejs)
- [Issues](https://github.com/resillix/racejs/issues)
- [Discussions](https://github.com/resillix/racejs/discussions)
- [npm Package](https://www.npmjs.com/package/@racejs/core)

## 🎓 Need Help?

- 📖 Read the [documentation](../README.md)
- 💬 Join [discussions](https://github.com/resillix/racejs/discussions)
- 🐛 Report [issues](https://github.com/resillix/racejs/issues)
- 📧 Email: dhananjaylatpate@resillix.com

---

**Happy coding with RaceJS! 🏁**
