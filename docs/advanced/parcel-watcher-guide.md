# @parcel/watcher Integration Guide

## Overview

RaceJS now supports `@parcel/watcher`, a professional-grade file watching solution used by major tools like Parcel, Turbopack, and Rome Tools. This provides significantly better performance and reliability than Node's built-in `fs.watch`.

## Why @parcel/watcher?

### Benefits

1. **🚀 Native Performance**
   - Written in C++ for maximum speed
   - Up to 10x faster than `fs.watch` in large projects
   - Minimal CPU and memory overhead

2. **🌍 Cross-platform Reliability**
   - Consistent behavior across Windows, macOS, Linux
   - Handles edge cases that `fs.watch` misses:
     - Docker volumes
     - Network drives
     - Symlinks
     - Large directories (10,000+ files)

3. **⚡️ Better Event Handling**
   - Batches events intelligently
   - Fewer false positives
   - More accurate change detection

4. **🏭 Battle-tested**
   - Used in production by:
     - Parcel bundler
     - Turbopack (Vercel)
     - Rome Tools
     - Many other major projects

## Installation

`@parcel/watcher` is an **optional dependency** in RaceJS. If not installed, RaceJS automatically falls back to `fs.watch`.

### Option 1: Install with your package manager

```bash
# npm
npm install @parcel/watcher

# pnpm
pnpm add @parcel/watcher

# yarn
yarn add @parcel/watcher
```

### Option 2: Already included in @racejs/core

If you install `@racejs/core`, `@parcel/watcher` is listed as an `optionalDependency`, so package managers may attempt to install it automatically. If installation fails (e.g., no C++ compiler), RaceJS will silently fall back to `fs.watch`.

## Automatic Backend Selection

RaceJS automatically selects the best available watcher backend:

```
Priority:
1. @parcel/watcher (if installed and working)
2. fs.watch (native Node.js)
3. Polling (last resort fallback)
```

## Checking Which Backend is Active

When you start a RaceJS server with hot reload, the console shows which backend is in use:

```javascript
const { createApp } = require('@racejs/core');
const app = createApp();
app.listen(3000);
```

**Console output:**

- With @parcel/watcher:
  ```
  🔥 Hot reload enabled (🚀 @parcel/watcher) for: [ '/path/to/routes' ]
  ```

- Without @parcel/watcher:
  ```
  🔥 Hot reload enabled (📁 fs.watch) for: [ '/path/to/routes' ]
  ```

## Programmatic API

You can check if `@parcel/watcher` is available:

```javascript
import { hasParcelWatcher, SmartWatcher } from '@racejs/core';

// Check if @parcel/watcher is available
console.log('Has @parcel/watcher:', hasParcelWatcher());

// Get backend info
const info = SmartWatcher.getBackendInfo();
console.log('Backend:', info.backend); // 'parcel' | 'native'
console.log('Has Parcel:', info.hasParcel); // boolean
```

## Troubleshooting

### @parcel/watcher installation fails

**Common causes:**
- No C++ compiler available (Windows: Visual Studio Build Tools, macOS: Xcode, Linux: build-essential)
- Node.js version mismatch
- Platform not supported (very rare)

**Solution:**
Don't worry! RaceJS will automatically fall back to `fs.watch`, which works fine for most development scenarios.

### I want to force @parcel/watcher

If `@parcel/watcher` is installed but not being used:

1. Check if it compiled correctly:
   ```bash
   node -e "console.log(require('@parcel/watcher'))"
   ```

2. If you see an error, try rebuilding:
   ```bash
   npm rebuild @parcel/watcher
   ```

### I want to force fs.watch (disable @parcel/watcher)

Simply don't install `@parcel/watcher`, or uninstall it:

```bash
npm uninstall @parcel/watcher
```

RaceJS will automatically use `fs.watch`.

## Performance Comparison

### Small Project (< 100 files)
- `fs.watch`: ✅ Fast enough
- `@parcel/watcher`: ⚡️ Slightly faster, but difference is minimal

**Recommendation**: Either is fine

### Medium Project (100-1,000 files)
- `fs.watch`: ⚠️ Noticeable lag on some platforms
- `@parcel/watcher`: ⚡️ Consistently fast

**Recommendation**: Use `@parcel/watcher`

### Large Project (1,000+ files)
- `fs.watch`: ❌ Can be slow, miss events, or be unreliable
- `@parcel/watcher`: ✅ Fast and reliable

**Recommendation**: Definitely use `@parcel/watcher`

## Production Deployment

Hot reload is automatically disabled in production (`NODE_ENV=production`), so the watcher backend doesn't matter in production.

However, if you're deploying in a Docker container or similar environment where hot reload is enabled for development:

1. **If using @parcel/watcher**: Ensure your Docker image has a C++ compiler during the build stage, or use pre-built binaries.

2. **If using fs.watch**: No special requirements.

## Example Configuration

### package.json
```json
{
  "dependencies": {
    "@racejs/core": "^1.0.0"
  },
  "optionalDependencies": {
    "@parcel/watcher": "^2.4.0"
  }
}
```

### Dockerfile (with @parcel/watcher)
```dockerfile
FROM node:20-alpine

# Install build tools for native addons
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

## Technical Details

### Watcher Backend Architecture

```
Application
  └─> HotReloadManager
       └─> SmartWatcher
            └─> WatcherBackend (adapter)
                 ├─> ParcelWatcherBackend (@parcel/watcher)
                 ├─> NativeWatcherBackend (fs.watch)
                 └─> PollingWatcherBackend (setInterval fallback)
```

### Event Flow

1. File system changes detected by backend
2. Events mapped to unified format (`create`, `update`, `delete`)
3. Debounced and batched by SmartWatcher
4. Passed to HotReloadManager
5. Module reloaded and routes swapped atomically

## FAQ

### Q: Do I need to install @parcel/watcher?
**A**: No, it's optional. RaceJS works fine without it using `fs.watch`.

### Q: Will my app break if @parcel/watcher fails to install?
**A**: No, RaceJS automatically falls back to `fs.watch`.

### Q: Is @parcel/watcher required for production?
**A**: No, hot reload is disabled in production anyway.

### Q: Does @parcel/watcher increase my bundle size?
**A**: No, it's a dev dependency (optional) and not included in your production build.

### Q: My project has 50,000 files. Should I use @parcel/watcher?
**A**: Yes! `@parcel/watcher` is specifically designed for large monorepos and will dramatically improve performance.

## Recommended Setup

### For Small Projects
```bash
npm install @racejs/core
# @parcel/watcher optional - fs.watch is fine
```

### For Large Projects / Monorepos
```bash
npm install @racejs/core @parcel/watcher
# Install @parcel/watcher for best performance
```

### For Teams
```json
{
  "scripts": {
    "postinstall": "node -e \"try{require('@parcel/watcher')}catch{console.warn('⚠️  @parcel/watcher not available, using fs.watch fallback')}\""
  }
}
```

This will notify developers if `@parcel/watcher` failed to install, but won't break the build.

---

## Summary

✅ **@parcel/watcher integration complete!**

- ✅ Optional dependency - graceful fallback to `fs.watch`
- ✅ Automatic backend selection
- ✅ Console logging shows which backend is active
- ✅ Programmatic API to check availability
- ✅ Production-safe (hot reload disabled anyway)
- ✅ Battle-tested solution from major tools

**RaceJS now offers professional-grade file watching with zero configuration!** 🚀

