# RaceJS Examples

Welcome to the RaceJS examples! These examples demonstrate the features and capabilities of RaceJS, a high-performance web framework that's 2-4× faster than Express.

## � Available Examples

### 1. [Hello World](./01-hello-world)
**Difficulty:** Beginner  
**Concepts:** Basic routing, JSON responses, app.compile()

The simplest RaceJS application. Learn the fundamentals:
- Creating an app
- Defining routes
- Sending JSON responses
- Compiling for optimal performance

```bash
cd 01-hello-world && node index.js
```

### 2. [REST API](./02-rest-api)
**Difficulty:** Beginner  
**Concepts:** CRUD operations, route parameters, HTTP methods, body parsing

Build a complete TODO REST API with:
- GET, POST, PUT, DELETE endpoints
- Route parameters (`:id`)
- Request body parsing
- Error handling
- Logging middleware

```bash
cd 02-rest-api && node index.js
```

### 3. [Middleware](./03-middleware)
**Difficulty:** Intermediate  
**Concepts:** Global middleware, route middleware, authentication, validation

Comprehensive middleware patterns:
- Global middleware (logger, timing)
- Authentication middleware
- Rate limiting
- Body validation
- Multiple middleware chaining
- Error handling middleware

```bash
cd 03-middleware && node index.js
```

### 4. [Performance Optimization](./04-performance)
**Difficulty:** Intermediate  
**Concepts:** Route compilation, lazy parsing, streaming, compression

Maximize RaceJS performance with:
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

| Framework | Requests/sec | Latency (p99) |
|-----------|--------------|---------------|
| Express 4.x | ~30,000 | ~15ms |
| RaceJS (compat) | ~60,000 | ~8ms |
| RaceJS (native) | ~80,000 | ~4ms |

*Benchmarked on M1 Mac, Node.js 22, simple JSON endpoint*

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
Email: dhananjaylatpate@resellix.com  
Organization: [Resellix](https://github.com/resellix)

## 🔗 Links

- [GitHub Repository](https://github.com/resellix/racejs)
- [Issues](https://github.com/resellix/racejs/issues)
- [Discussions](https://github.com/resellix/racejs/discussions)
- [npm Package](https://www.npmjs.com/package/@racejs/core)

## 🎓 Need Help?

- 📖 Read the [documentation](../README.md)
- 💬 Join [discussions](https://github.com/resellix/racejs/discussions)
- 🐛 Report [issues](https://github.com/resellix/racejs/issues)
- 📧 Email: dhananjaylatpate@resellix.com

---

**Happy coding with RaceJS! 🏁**
