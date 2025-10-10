# Hot Reload - Zero Downtime Development

**Smart Hot Reload** is RaceJS's built-in feature that automatically reloads your application code without restarting the server. Edit your routes, save, and see changes instantly - with zero downtime!

## 🎯 Quick Start

Hot reload is **automatically enabled** in development mode - no configuration needed!

```javascript
const { createApp } = require('@racejs/core');

const app = createApp(); // Hot reload auto-enabled!

app.get('/api/users', (req, res) => {
  res.json({ users: ['Alice', 'Bob'] });
});

app.compile();
app.listen(3000);

// Edit the route above, save, and it reloads instantly! 🔥
```

**That's it!** No external tools, no configuration files, no server restarts.

## ✨ Features

### Zero Configuration

- Automatically enabled in development (`NODE_ENV !== 'production'`)
- Auto-detects route directories (`routes/`, `src/routes/`, `api/`, etc.)
- Works out of the box with sensible defaults

### Zero Downtime

- Server keeps running during reloads
- In-flight requests complete normally
- New requests immediately use updated handlers
- No dropped connections

### Native Performance

- Uses **@parcel/watcher** (Native C++) when available
- Falls back to `fs.watch` gracefully
- Typical reload time: **< 20ms**
- Minimal CPU and memory overhead

### Developer Experience

- Real-time console feedback
- Clear reload notifications
- File change summaries
- Error reporting

## 📊 Console Output

### Successful Reload

```
🔥 Hot reload enabled (🚀 @parcel/watcher) for: [ '/path/to/routes' ]
♻️  Reloading: users.js
✅ Reloaded in 12ms
```

### Error During Reload (Like Next.js!)

```
================================================================================
❌ Hot Reload Failed
================================================================================

📁 Files:
   routes/users.js

🔴 Error 1:
   Failed to reload /path/to/routes/users.js: Unexpected token '}'

📍 Stack Trace:
   at file:///path/to/routes/users.js:5:3
   at ModuleJob.run (node:internal/modules/esm/module_job:194:25)

💡 This looks like a syntax error. Check your code for:
   - Missing brackets, braces, or parentheses
   - Incorrect comma or semicolon placement
   - Typos in variable or function names

================================================================================
Fix the error(s) above and save to retry hot reload.
================================================================================
```

## 🏗️ How It Works

### Architecture

```
File Change → @parcel/watcher → SmartWatcher
                                      ↓
                                 DependencyGraph
                                      ↓
                                ModuleReloader (cache clear)
                                      ↓
                                  RouteSwapper (atomic update)
                                      ↓
                                   Router ✅
```

### Component Roles

1. **WatcherBackend** - Detects file system changes
   - Priority: @parcel/watcher > fs.watch > polling
   - Cross-platform support
   - Efficient event batching

2. **SmartWatcher** - Intelligent file watching
   - Dependency tracking
   - Event debouncing and batching
   - Topological ordering for safe reloads

3. **ModuleReloader** - Cache management
   - Clears Node.js require cache
   - Busts ESM import cache
   - Handles circular dependencies

4. **RouteSwapper** - Atomic updates
   - Swaps route handlers in-place
   - Thread-safe operations
   - Zero request loss

5. **HotReloadManager** - Orchestration
   - Coordinates all components
   - Event emission and logging
   - Error handling and recovery

## 🔧 Configuration

### Default Behavior

```javascript
// Development mode - hot reload enabled automatically
const app = createApp();
```

### Custom Configuration

```javascript
const app = createApp({
  hotReload: {
    enabled: true,
    roots: ['./routes', './api'], // Directories to watch
    debounceMs: 100, // Debounce delay
    batchMs: 200, // Batch window
    ignore: ['*.test.js'], // Ignore patterns
  },
});
```

### Disable Hot Reload

```javascript
// Completely disabled
const app = createApp({
  hotReload: false,
});
```

### Force Enable in Production

```javascript
// NOT recommended - for debugging only
const app = createApp({
  hotReload: {
    enabled: true, // Overrides production check
  },
});
```

## 📦 Dependencies

### Optional Dependency

```json
{
  "optionalDependencies": {
    "@parcel/watcher": "^2.4.0"
  }
}
```

**@parcel/watcher** is optional but recommended for best performance:

- Native C++ implementation
- Faster file change detection (< 10ms)
- Lower CPU usage
- Better cross-platform support

If not installed, RaceJS gracefully falls back to Node.js `fs.watch`.

### Check Availability

```javascript
const { hasParcelWatcher } = require('@racejs/core');

console.log('Using @parcel/watcher:', hasParcelWatcher());
```

## 🎯 Best Practices

### File Organization

Organize routes in dedicated directories for optimal hot reload:

```
project/
├── routes/           ✅ Automatically detected
│   ├── users.js
│   ├── posts.js
│   └── auth.js
├── src/
│   └── routes/       ✅ Also detected
│       └── api.js
└── server.js
```

### Route Module Pattern

Export route definitions as functions:

```javascript
// routes/users.js
module.exports = (app) => {
  app.get('/users', (req, res) => {
    res.json({ users: getUserList() });
  });

  app.post('/users', (req, res) => {
    const user = createUser(req.body);
    res.json(user);
  });
};
```

Load in your main file:

```javascript
// server.js
const fs = require('fs');
const path = require('path');

const app = createApp();

// Load all route files
const routesDir = path.join(__dirname, 'routes');
fs.readdirSync(routesDir)
  .filter((f) => f.endsWith('.js'))
  .forEach((file) => {
    require(path.join(routesDir, file))(app);
  });

app.compile();
app.listen(3000);
```

### Development Workflow

1. **Start your server** - Hot reload activates automatically
2. **Edit route files** - Make changes to handlers, logic, or responses
3. **Save** - Changes are detected and reloaded
4. **Test** - New requests immediately use updated code
5. **Repeat** - Keep iterating without manual restarts

### What Gets Reloaded

✅ **Automatically reloaded:**

- Route handlers
- Middleware functions
- Helper functions in route files
- Required modules (cache cleared)

❌ **Requires restart:**

- Server configuration
- Port changes
- Environment variables
- Native modules
- Application instance setup

## 🚀 Performance

### Benchmarks

| Operation             | Time       | Backend             |
| --------------------- | ---------- | ------------------- |
| File change detection | < 10ms     | @parcel/watcher     |
| File change detection | ~50ms      | fs.watch            |
| Module cache clear    | ~5ms       | Always              |
| Route swap            | ~3ms       | Always              |
| **Total reload**      | **< 20ms** | **@parcel/watcher** |
| Total reload          | ~60ms      | fs.watch            |

### Resource Usage

- **Memory overhead:** ~5MB for watcher
- **CPU idle:** < 0.1%
- **CPU during reload:** Brief spike to ~2-5%
- **Disk I/O:** Minimal (event-driven)

## 🔍 Troubleshooting

### Hot Reload Not Working

**Check if enabled:**

```javascript
// In development, should log hot reload status
app.listen(3000, () => {
  console.log('Server started');
  // Look for: 🔥 Hot reload enabled...
});
```

**Check NODE_ENV:**

```bash
# Should be empty or 'development'
echo $NODE_ENV

# Or explicitly set
NODE_ENV=development node server.js
```

**Check file location:**

- Files must be in watched directories
- Default: `routes/`, `src/routes/`, `api/`, `src/api/`, `src/`, `lib/`
- Or specify custom paths in config

### Changes Not Detected

**File not in watched directory:**

```javascript
// Add custom watch paths
const app = createApp({
  hotReload: {
    roots: ['./routes', './controllers', './custom-path'],
  },
});
```

**File ignored by pattern:**

```javascript
// Check ignore patterns
const app = createApp({
  hotReload: {
    ignore: [
      '*.test.js', // Ignored
      '*.spec.js', // Ignored
      'node_modules/**', // Ignored by default
    ],
  },
});
```

### Slow Reloads

**Install @parcel/watcher:**

```bash
npm install --save-optional @parcel/watcher
# or
pnpm add -D @parcel/watcher
```

**Reduce watched files:**

```javascript
// Be specific with watch paths
const app = createApp({
  hotReload: {
    roots: ['./routes'], // Only watch routes, not entire src/
    ignore: ['*.test.js', '*.md'],
  },
});
```

**Adjust timing:**

```javascript
// Reduce debounce for faster reloads
const app = createApp({
  hotReload: {
    debounceMs: 50, // Default: 100ms
    batchMs: 100, // Default: 200ms
  },
});
```

### Module Cache Issues

**Clear cache manually if needed:**

```javascript
// In rare cases, force module reload
delete require.cache[require.resolve('./problematic-module')];
```

**Restart for deep changes:**

- Changing dependencies of dependencies
- Modifying native modules
- Altering core application structure

## 🧪 Testing Hot Reload

### Manual Test

```bash
# Terminal 1: Start server
node server.js

# Terminal 2: Make requests in a loop
watch -n 1 'curl -s http://localhost:3000/api/users'

# Terminal 3: Edit files
vim routes/users.js  # Change response, save, see update!
```

### Verify Backend

```javascript
const { hasParcelWatcher, createApp } = require('@racejs/core');

console.log('Backend available:', hasParcelWatcher());

const app = createApp();
// Watch console for: 🔥 Hot reload enabled (🚀 @parcel/watcher)...
```

## 📚 Examples

See working examples in `/examples`:

- `examples/08-builtin-hot-reload/` - Basic hot reload demonstration
- `examples/09-hot-reload-demo/` - Live monitoring with stats

## 🔗 Related Documentation

- [Architecture Overview](./architecture.md)
- [Migration Guide](./migration.md)
- [Performance Tuning](./performance.md)
- [@parcel/watcher Integration](./parcel-watcher-guide.md)

## ❓ FAQ

**Q: Do I need to install @parcel/watcher?**
A: No, it's optional. RaceJS works without it, but @parcel/watcher provides better performance.

**Q: Does hot reload work in production?**
A: No, it's automatically disabled in production. You can force-enable it, but it's not recommended.

**Q: Will hot reload work with TypeScript?**
A: Yes, if you compile TypeScript to JavaScript and watch the compiled files.

**Q: Can I use this with Docker?**
A: Yes, but you may need to configure volume mounts properly for file watching to work.

**Q: What's the difference from nodemon?**
A: Nodemon restarts your entire server. RaceJS hot reload only reloads changed modules without restarting - zero downtime!

**Q: Does it handle syntax errors?**
A: Yes! Syntax errors are caught and displayed with detailed error messages, line numbers, and stack traces - just like Next.js. Your server keeps running and you can fix the error and save to retry.

**Q: What happens if my code has an error?**
A: The hot reload will fail gracefully and display a detailed error report in the terminal, including the file path, error message, stack trace, and helpful suggestions. Your server continues running with the previous working code.

---

**Built with ❤️ for developer productivity**

Enjoy zero-downtime development with RaceJS! 🚀
