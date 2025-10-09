# Built-in Hot Reload Example

This example demonstrates RaceJS's **professional built-in hot reload system** - just like Next.js, Vite, and other modern frameworks!

## 🎯 Key Features

- **Zero Configuration**: Hot reload works automatically in development mode
- **Auto-Detection**: Automatically finds and watches your route directories
- **Production Safe**: Disabled in production by default
- **Smart Watching**: Only watches relevant directories (routes/, src/, api/, etc.)
- **Real-time Feedback**: Console logs show exactly what's reloading

## 🚀 How It Works

1. **Automatic Activation**: When `NODE_ENV !== 'production'`, hot reload is enabled automatically
2. **Smart Directory Detection**: Automatically detects common patterns:
   - `routes/`
   - `src/routes/`
   - `api/`
   - `src/api/`
   - `src/`
   - `lib/`
3. **No Manual Setup**: Just create your app with `createApp()` - hot reload is ready!

## 📦 Running the Example

```bash
# Development mode (hot reload enabled)
npm start

# Or explicitly set NODE_ENV
npm run dev
```

## 🧪 Testing Hot Reload

1. Start the server:
   ```bash
   npm start
   ```

2. Make a request to see the current version:
   ```bash
   curl http://localhost:3000/users
   # Note the "version: 1" in the response
   ```

3. Edit `routes/users.js`:
   - Change `version: 1` to `version: 2`
   - Save the file

4. Watch the console for hot reload messages:
   ```
   ♻️  Reloading: routes/users.js
   ✅ Reloaded in 45ms
   ```

5. Make the same request again:
   ```bash
   curl http://localhost:3000/users
   # Now see "version: 2" - zero downtime!
   ```

## 🎛️ Configuration (Optional)

While hot reload works with zero config, you can customize it if needed:

```javascript
const app = createApp({
  hotReload: {
    enabled: true,
    roots: ['./custom-routes', './api'],
    debounceMs: 100,
    batchMs: 150,
    ignore: ['**/*.test.js', '**/temp/**'],
  }
});
```

Or disable it explicitly:

```javascript
const app = createApp({
  hotReload: false
});
```

## 📝 Route Module Format

For hot reload to work with route swapping, export a `routes` array:

```javascript
exports.routes = [
  { method: 'GET', path: '/users', handlers: [getUsersHandler] },
  { method: 'POST', path: '/users', handlers: [createUserHandler] },
];
```

## 🎨 Try These Changes

**In `routes/users.js`:**
- Change the `message` field
- Modify the `version` number
- Add a new field to the response
- Change user data

**In `routes/products.js`:**
- Update product prices
- Add new products to the array
- Modify response structure
- Change the version

All changes reload **instantly** with **zero downtime**! 🚀

## 🔥 Production Mode

In production (`NODE_ENV=production`), hot reload is automatically disabled for optimal performance:

```bash
NODE_ENV=production node index.js
# Hot reload: disabled
```

## 🎯 Comparison with Manual Setup

**Before (Manual):**
```javascript
const app = createApp();
const hotReload = new HotReloadManager({ ... });
hotReload.setRouter(app.router);
hotReload.start();
// Manual event handling...
```

**After (Built-in):**
```javascript
const app = createApp();
// That's it! Hot reload works automatically in development 🎉
```

---

**Built with 🔥 by the RaceJS team**
