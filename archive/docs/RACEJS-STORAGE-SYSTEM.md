# .racejs Storage System - Complete Guide

## Overview

The `.racejs` directory is a **persistent, file-based storage system** that maintains all development session data across:

- Server restarts
- Code changes
- Day-to-day development
- Team collaboration
- CI/CD pipelines

## Directory Structure

```
your-project/
├── .racejs/                    # Created automatically
│   ├── requests/               # HTTP request recordings
│   │   ├── req_123456789.json
│   │   ├── req_123456790.json
│   │   └── ...
│   ├── errors/                 # Error tracking (future)
│   ├── sessions/               # Development sessions (future)
│   ├── config.json             # Storage configuration
│   └── metadata.json           # Index and statistics
├── .gitignore                  # Excludes .racejs/
├── src/
└── package.json
```

## How It Works

### 1. **First Time Setup (Day 1)**

```bash
# Developer starts the project
cd my-project
node app.js
```

**What happens:**

1. RaceJS detects no `.racejs` directory exists
2. Creates `.racejs/` in project root
3. Creates subdirectories: `requests/`, `errors/`, `sessions/`
4. Initializes `config.json` and `metadata.json`
5. Starts recording requests to individual JSON files

**Console output:**

```
✅ Created .racejs storage directory
📁 Storage location: /path/to/my-project/.racejs
🎯 Request recording enabled
```

### 2. **During Development Session**

```bash
# Developer makes API calls
curl http://localhost:3000/api/users
curl -X POST http://localhost:3000/api/users -d '{"name":"John"}'
curl http://localhost:3000/api/products
```

**What gets stored:**

Each request creates a file: `.racejs/requests/req_[timestamp]_[random].json`

Example: `.racejs/requests/req_1760786235995_xuw4fthtc.json`

```json
{
  "id": "req_1760786235995_xuw4fthtc",
  "timestamp": 1760786235995,
  "method": "GET",
  "url": "/api/users",
  "headers": {
    "user-agent": "curl/8.5.0",
    "accept": "*/*"
  },
  "query": {},
  "params": {},
  "body": null,
  "response": {
    "statusCode": 200,
    "headers": {
      "content-type": "application/json"
    },
    "body": {
      "success": true,
      "data": [...]
    },
    "timestamp": 1760786236001
  },
  "duration": 6,
  "meta": {
    "ip": "::ffff:127.0.0.1",
    "userAgent": "curl/8.5.0"
  }
}
```

### 3. **End of Day - Developer Stops Server**

```bash
# Developer stops the server
Ctrl+C
```

**What happens:**

1. All requests are **already saved** to disk (real-time)
2. Metadata is updated with session statistics
3. Storage remains intact in `.racejs/`

**Data preserved:**

- ✅ All HTTP requests (method, URL, headers, body, response)
- ✅ Response times and durations
- ✅ Error occurrences
- ✅ Request timestamps
- ✅ Complete request/response lifecycle

### 4. **Next Day - Developer Returns**

```bash
# Next morning - developer starts server again
node app.js
```

**What happens:**

1. RaceJS detects existing `.racejs/` directory
2. Loads all historical requests from disk
3. Populates DevTools UI with yesterday's data
4. Continues recording new requests

**Console output:**

```
✅ Loaded .racejs storage
📊 Found 247 recorded requests from previous sessions
🕐 Oldest request: 2 days ago
🎯 Ready to record new requests
```

**DevTools UI shows:**

```
Recorded Requests (247 total)
┌────────┬──────────────────┬────────┬──────────┬─────────────────────┐
│ Method │ URL              │ Status │ Duration │ Time                │
├────────┼──────────────────┼────────┼──────────┼─────────────────────┤
│ GET    │ /api/users       │ 200    │ 5ms      │ Yesterday, 5:30 PM  │
│ POST   │ /api/users       │ 201    │ 12ms     │ Yesterday, 5:31 PM  │
│ GET    │ /api/products    │ 200    │ 3ms      │ Yesterday, 5:32 PM  │
│ ...    │ ...              │ ...    │ ...      │ ...                 │
└────────┴──────────────────┴────────┴──────────┴─────────────────────┘
```

### 5. **Developer Can Replay Old Requests**

```javascript
// Developer wants to replay yesterday's request
// Opens DevTools UI -> Requests tab -> Clicks "Replay" on old request
```

**What happens:**

1. Loads request from `.racejs/requests/req_123456789.json`
2. Replays exact same request to current server
3. Compares old vs new response
4. Shows differences if API behavior changed

**Use cases:**

- ✅ "Did my code change break the API?"
- ✅ "What was the response yesterday vs today?"
- ✅ "Generate tests from real production requests"

## Lifecycle Scenarios

### Scenario 1: Multi-Day Development

```bash
# Day 1
node app.js
curl http://localhost:3000/api/test
# Stop server
^C

# Day 2
node app.js  # All Day 1 data still available!
curl http://localhost:3000/api/test  # New request added
# Stop server
^C

# Day 3
node app.js  # All Day 1 + Day 2 data available!
```

**Result:** Complete development history preserved

### Scenario 2: Code Changes & Hot Reload

```bash
# Start server with hot reload
node app.js

# Developer edits routes/users.js
# Server auto-reloads

# ✅ Request data NOT lost during hot reload
# ✅ All recordings still accessible
```

### Scenario 3: Team Collaboration (Git)

```bash
# Developer A (excluded from git)
git add .gitignore  # .racejs/ is ignored
git commit -m "Added new feature"
git push

# Developer B (pulls changes)
git pull
node app.js  # Creates their own .racejs/ directory
# Each developer has their own local request history
```

**Why ignored from git?**

- Personal development data
- Can be large (many MB)
- Environment-specific
- Privacy (may contain sensitive data)

### Scenario 4: Testing & CI/CD

```yaml
# .github/workflows/test.yml
name: Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
      # .racejs/ created temporarily, discarded after tests
```

**In CI:**

- ✅ Each CI run gets fresh `.racejs/`
- ✅ No pollution between test runs
- ✅ Storage works identically to local development

## Storage Management

### Automatic Cleanup

```javascript
// Configured in recorder options
{
  storage: {
    type: 'file',
    options: {
      directory: '.racejs',
      maxRequests: 1000,        // Keep last 1000 requests
      maxAge: 7 * 24 * 60 * 60 * 1000,  // Keep 7 days of data
      cleanupInterval: 60 * 60 * 1000    // Cleanup every hour
    }
  }
}
```

**Cleanup rules:**

1. **Age-based:** Deletes requests older than 7 days
2. **Count-based:** Keeps only last 1000 requests
3. **Size-based:** Limits storage to 100MB
4. **Automatic:** Runs in background every hour

### Manual Management

```bash
# View storage statistics
ls -lh .racejs/requests/
# Total size: 2.3 MB, 247 files

# Clear all recorded requests
rm -rf .racejs/requests/*

# Clear all data (fresh start)
rm -rf .racejs/

# Backup recordings
tar -czf recordings-backup.tar.gz .racejs/
```

## File Format Details

### Request File Naming

```
req_[timestamp]_[random].json
    └─────┬────┘  └───┬──┘
          │           └── Random ID (prevents collisions)
          └── Unix timestamp (sortable, chronological)
```

**Benefits:**

- ✅ Files sorted chronologically by name
- ✅ No ID collisions
- ✅ Easy to find requests by time
- ✅ Human-readable timestamps

### Metadata Index

`.racejs/metadata.json` - Fast lookups without reading all files

```json
{
  "version": "1.0.0",
  "lastUpdated": 1760786235995,
  "statistics": {
    "totalRequests": 247,
    "totalSize": 2458624,
    "oldestRequest": 1759786235995,
    "newestRequest": 1760786235995,
    "methodBreakdown": {
      "GET": 189,
      "POST": 42,
      "PUT": 12,
      "DELETE": 4
    },
    "statusBreakdown": {
      "2xx": 230,
      "4xx": 12,
      "5xx": 5
    }
  },
  "index": {
    "req_1760786235995_xuw4fthtc": {
      "file": "requests/req_1760786235995_xuw4fthtc.json",
      "method": "GET",
      "url": "/api/users",
      "timestamp": 1760786235995,
      "statusCode": 200
    }
  }
}
```

## Performance Characteristics

### Write Performance

- **Async writes:** Non-blocking I/O
- **Batched writes:** Groups small writes
- **No lock contention:** Each request = separate file
- **Impact:** < 1ms overhead per request

### Read Performance

- **Indexed lookups:** Metadata file for fast searches
- **Lazy loading:** Only load needed requests
- **Cached metadata:** In-memory for speed
- **Pagination:** Load 50 requests at a time

### Storage Size

- **Average request:** ~10KB
- **1000 requests:** ~10MB
- **With cleanup:** Max 100MB
- **Compression:** Optional gzip for old requests

## Best Practices

### 1. Development Workflow

```javascript
// Good: Enable in development
const app = createApp({
  devMode: {
    enabled: process.env.NODE_ENV !== 'production',
    recorder: {
      storage: { type: 'file' }, // Persistent storage
    },
  },
});
```

### 2. Sensitive Data

```javascript
// Sanitize sensitive data before storage
recorder: {
  storage: { type: 'file' },
  sanitizeHeaders: true,  // Removes authorization, cookies
  excludePaths: [
    '/auth/*',           // Don't record login requests
    '/admin/*'           // Don't record admin requests
  ]
}
```

### 3. Storage Limits

```javascript
// Prevent unlimited growth
storage: {
  type: 'file',
  options: {
    maxRequests: 1000,     // Reasonable limit
    maxAge: 7 * 86400000,  // 7 days
    maxSize: 50 * 1024 * 1024  // 50 MB
  }
}
```

### 4. Team Collaboration

```bash
# .gitignore
.racejs/           # Exclude from version control

# .racejs/README.md (optional - commit this)
# This directory contains local development data
# It's auto-generated and excluded from git
# Safe to delete - will be recreated
```

## Troubleshooting

### Storage Not Working?

```bash
# Check directory permissions
ls -la .racejs/

# Check disk space
df -h

# Check file count
ls .racejs/requests/ | wc -l

# View logs
tail -f .racejs/storage.log
```

### Too Much Storage Used?

```bash
# Check size
du -sh .racejs/

# Manual cleanup
rm -rf .racejs/requests/*

# Or configure auto-cleanup
# (see Storage Management section)
```

### Lost Data After Restart?

**Possible causes:**

1. `.racejs/` deleted manually
2. Different working directory
3. File permissions issue
4. Storage disabled in config

**Solution:**

```bash
# Verify storage location
pwd
ls -la .racejs/

# Check configuration
cat .racejs/config.json
```

## Migration Guide

### From Memory Storage to File Storage

```javascript
// Before (memory - data lost on restart)
const app = createApp({
  devMode: {
    recorder: {
      storage: 'memory', // Default
    },
  },
});

// After (file - data persists)
const app = createApp({
  devMode: {
    recorder: {
      storage: {
        type: 'file',
        options: {
          directory: '.racejs', // Auto-created
        },
      },
    },
  },
});
```

**Benefits:**

- ✅ No code changes needed in routes
- ✅ Same DevTools UI
- ✅ Zero downtime migration
- ✅ Automatic data persistence

## Summary

The `.racejs` storage system provides:

1. **Persistence:** Data survives server restarts, code changes, and days/weeks/months
2. **Performance:** Fast file-based storage with indexing
3. **Reliability:** Each request is a separate file (no corruption risk)
4. **Scalability:** Automatic cleanup prevents unlimited growth
5. **Privacy:** Excluded from git, local to each developer
6. **Debugging:** Complete request history for time-travel debugging
7. **Testing:** Generate tests from real production requests
8. **Collaboration:** Each developer maintains their own session data

**Perfect for:**

- Long-term development projects
- API development and debugging
- Request/response testing
- Performance tracking
- Bug reproduction
- Team development (each dev has their own data)
