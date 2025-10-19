# Real-World Developer Workflow with .racejs Storage

## Scenario: Building an E-commerce API

### Timeline Overview

```
Monday AM    → Initial development, create user endpoints
Monday PM    → Server stopped, go home
Tuesday AM   → Return, continue with products endpoint
Wednesday    → Bug found, need to replay Monday's requests
Thursday     → Generate tests from real requests
Friday       → Week review, data analysis
```

---

## 🗓️ MONDAY MORNING - Initial Development

### Start Server

```bash
cd my-ecommerce-api
node app.js
```

**What happens:**

```
✅ Created .racejs storage directory
📁 Storage location: /Users/dev/my-ecommerce-api/.racejs
🎯 Request recording enabled
🚀 Server running on http://localhost:3000
```

### Make Development Requests

```bash
# Test user creation
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Response: {"id":1,"name":"John Doe","email":"john@example.com"}
```

**Behind the scenes:**

```
.racejs/
└── requests/
    └── req_1760786000001_abc123.json  ← Saved immediately
```

**File content:**

```json
{
  "id": "req_1760786000001_abc123",
  "timestamp": 1760786000001,
  "method": "POST",
  "url": "/api/users",
  "headers": {...},
  "body": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "response": {
    "statusCode": 201,
    "body": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "timestamp": 1760786000015
  },
  "duration": 14
}
```

### Continue Development

```bash
# Get user
curl http://localhost:3000/api/users/1
# → Recorded to: req_1760786000050_xyz789.json

# Update user
curl -X PUT http://localhost:3000/api/users/1 \
  -d '{"name":"John Smith"}'
# → Recorded to: req_1760786000098_def456.json

# Delete user
curl -X DELETE http://localhost:3000/api/users/1
# → Recorded to: req_1760786000145_ghi789.json
```

**Current storage:**

```
.racejs/
├── index.json (metadata)
└── requests/
    ├── req_1760786000001_abc123.json  (POST /api/users)
    ├── req_1760786000050_xyz789.json  (GET /api/users/1)
    ├── req_1760786000098_def456.json  (PUT /api/users/1)
    └── req_1760786000145_ghi789.json  (DELETE /api/users/1)

Total: 4 requests, ~40KB
```

### End of Monday - Stop Server

```bash
# Press Ctrl+C
^C
Server stopped
✅ All request data persisted to .racejs/
```

**Data is SAFE on disk!**

```bash
ls -lh .racejs/requests/
# -rw-r--r-- 1 dev staff 10K Oct 18 17:30 req_1760786000001_abc123.json
# -rw-r--r-- 1 dev staff 8K  Oct 18 17:31 req_1760786000050_xyz789.json
# -rw-r--r-- 1 dev staff 9K  Oct 18 17:32 req_1760786000098_def456.json
# -rw-r--r-- 1 dev staff 7K  Oct 18 17:33 req_1760786000145_ghi789.json
```

---

## 🗓️ TUESDAY MORNING - Developer Returns

### Start Server (Next Day)

```bash
node app.js
```

**What happens:**

```
✅ Loaded .racejs storage
📊 Found 4 recorded requests from previous sessions
🕐 Oldest request: 18 hours ago (Monday 5:30 PM)
🕐 Newest request: 17 hours ago (Monday 5:33 PM)
🎯 Ready to record new requests
🚀 Server running on http://localhost:3000
```

### Open DevTools UI

```bash
# Open http://localhost:9229
```

**DevTools shows:**

```
Recorded Requests (4 total)
┌────────┬──────────────────┬────────┬──────────┬─────────────────────┐
│ Method │ URL              │ Status │ Duration │ Time                │
├────────┼──────────────────┼────────┼──────────┼─────────────────────┤
│ POST   │ /api/users       │ 201    │ 14ms     │ Yesterday, 5:30 PM  │
│ GET    │ /api/users/1     │ 200    │ 5ms      │ Yesterday, 5:31 PM  │
│ PUT    │ /api/users/1     │ 200    │ 12ms     │ Yesterday, 5:32 PM  │
│ DELETE │ /api/users/1     │ 204    │ 3ms      │ Yesterday, 5:33 PM  │
└────────┴──────────────────┴────────┴──────────┴─────────────────────┘

[View] [Replay] buttons available for each request
```

### Add New Products Endpoint

```bash
# Test new products endpoint
curl -X POST http://localhost:3000/api/products \
  -d '{"name":"Laptop","price":999}'
# → Recorded to: req_1760850000001_new123.json

curl http://localhost:3000/api/products
# → Recorded to: req_1760850000050_new456.json
```

**Updated storage:**

```
.racejs/requests/
├── req_1760786000001_abc123.json  (Monday - POST user)
├── req_1760786000050_xyz789.json  (Monday - GET user)
├── req_1760786000098_def456.json  (Monday - PUT user)
├── req_1760786000145_ghi789.json  (Monday - DELETE user)
├── req_1760850000001_new123.json  (Tuesday - POST product) ← NEW
└── req_1760850000050_new456.json  (Tuesday - GET products) ← NEW

Total: 6 requests, ~60KB
```

**DevTools now shows 6 total requests** (Monday + Tuesday combined)

---

## 🗓️ WEDNESDAY - Bug Investigation

### Problem Discovered

```
User reports: "User creation was working Monday,
now it returns 500 error!"
```

### Debug Using Historical Data

**Step 1: Find Monday's working request**

```javascript
// DevTools UI → Requests tab → Filter by "Monday"
// Find: POST /api/users (Status 201, Monday 5:30 PM)
```

**Step 2: View exact request that worked**

```javascript
// Click "View" button
// Shows complete request:
{
  "method": "POST",
  "url": "/api/users",
  "body": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "response": {
    "statusCode": 201,  ✅ Worked!
    ...
  }
}
```

**Step 3: Replay the same request today**

```javascript
// Click "Replay" button
// RaceJS replays exact same request to current server
```

**Result:**

```json
{
  "originalRequest": {
    "timestamp": "Monday 5:30 PM",
    "statusCode": 201  ✅
  },
  "replayedRequest": {
    "timestamp": "Wednesday 10:00 AM",
    "statusCode": 500  ❌
  },
  "comparison": {
    "statusCodeMatch": false,
    "differences": [
      {
        "field": "statusCode",
        "original": 201,
        "replayed": 500,
        "reason": "Database connection missing"
      }
    ]
  }
}
```

**Bug Found!** Database configuration changed between Monday and Wednesday

---

## 🗓️ THURSDAY - Test Generation

### Generate Tests from Real Requests

**Select multiple successful requests from Monday:**

```javascript
// DevTools UI → Requests tab
// Select:
// - POST /api/users (Status 201)
// - GET /api/users/1 (Status 200)
// - PUT /api/users/1 (Status 200)

// Click "Export" → "Vitest Test Suite"
```

**Generated test file (auto-downloaded):**

```javascript
// users.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('User API - Generated from recordings', () => {
  it('should create user (recorded: Monday Oct 18, 5:30 PM)', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com',
    });
    expect(response.body.id).toBeDefined();
  });

  it('should get user by ID (recorded: Monday Oct 18, 5:31 PM)', async () => {
    // ... generated from recorded request
  });

  it('should update user (recorded: Monday Oct 18, 5:32 PM)', async () => {
    // ... generated from recorded request
  });
});
```

**Benefits:**

- ✅ Real production data becomes test cases
- ✅ No manual test writing needed
- ✅ Covers actual use cases
- ✅ Reference to original timestamp for context

---

## 🗓️ FRIDAY - Weekly Review

### Analyze Development Data

```bash
# View statistics
cat .racejs/index.json
```

**Output:**

```json
{
  "version": "1.0.0",
  "statistics": {
    "totalRequests": 47,
    "totalSize": "480 KB",
    "dateRange": {
      "oldest": "Monday Oct 18, 5:30 PM",
      "newest": "Friday Oct 22, 4:15 PM"
    },
    "methodBreakdown": {
      "GET": 25,
      "POST": 15,
      "PUT": 5,
      "DELETE": 2
    },
    "statusBreakdown": {
      "2xx": 42,  ✅ 89% success
      "4xx": 3,   ⚠️  6% client errors
      "5xx": 2    ❌ 4% server errors
    },
    "averageResponseTime": "12ms",
    "slowestEndpoint": "/api/products/search (245ms)"
  }
}
```

### Export Week's Data

```bash
# Backup this week's recordings
tar -czf recordings-week-$(date +%Y%m%d).tar.gz .racejs/

# Archive: recordings-week-20251022.tar.gz (480 KB)
```

### Cleanup Old Data

```bash
# Option 1: Delete old requests (keep last 7 days)
# Happens automatically if configured

# Option 2: Manual cleanup
find .racejs/requests/ -type f -mtime +7 -delete

# Option 3: Fresh start next week
rm -rf .racejs/
# Will be recreated Monday morning
```

---

## 📊 Storage Growth Over Time

```
Week 1:  47 requests  →    480 KB
Week 2:  103 requests →    1.1 MB
Week 3:  89 requests  →    920 KB
Month:   239 requests →    2.4 MB

With auto-cleanup (7-day retention):
Stabilizes at: ~1.5 MB (keeps last week only)
```

---

## 🎯 Key Benefits Demonstrated

### 1. **Time-Travel Debugging**

```
Problem: Bug appeared Wednesday
Solution: Replay Monday's working request
Result: Found exact difference (database config)
Time saved: 2 hours of debugging
```

### 2. **No Lost Work**

```
Monday's work → Persisted
Tuesday's work → Added to Monday's data
Wednesday → All history available
Result: 5-day complete development history
```

### 3. **Test Generation**

```
Manual test writing: 30 minutes per endpoint
Auto-generation from recordings: 30 seconds
Tests created: 15 tests from 15 real requests
Time saved: 7.5 hours
```

### 4. **Team Collaboration**

```
Developer A's .racejs/ → Local, private
Developer B's .racejs/ → Local, private
.gitignore → Excludes .racejs/
Result: No conflicts, personal data
```

### 5. **Production Insights**

```
Most used endpoints: GET /api/users (25 calls)
Slowest endpoint: /api/products/search (245ms)
Error rate: 10% (needs attention)
Result: Data-driven optimization
```

---

## 🚀 Advanced Workflows

### Workflow 1: Bug Reproduction

```bash
# Customer reports bug with specific request
# 1. Import their request into .racejs/requests/
# 2. Replay in DevTools
# 3. Debug with exact conditions
# 4. Fix and verify
```

### Workflow 2: API Versioning

```bash
# Test v1 vs v2 compatibility
# 1. Replay all v1 requests against v2 endpoint
# 2. Compare responses
# 3. Identify breaking changes
# 4. Create migration guide
```

### Workflow 3: Performance Tracking

```bash
# Track performance over sprint
# 1. Week 1 baseline: 12ms average
# 2. Week 2 after optimization: 8ms average
# 3. Week 3 after caching: 3ms average
# Result: 75% improvement documented
```

---

## 📝 Summary

The `.racejs` storage system provides a **complete development memory** that:

1. ✅ **Survives restarts** - Work from days/weeks ago is always available
2. ✅ **Enables time-travel** - Replay any historical request
3. ✅ **Generates tests** - Convert real requests to test suites
4. ✅ **Tracks performance** - Historical response time data
5. ✅ **Aids debugging** - Compare working vs broken requests
6. ✅ **Private data** - Each developer has their own history
7. ✅ **Self-managing** - Auto-cleanup prevents unlimited growth

**Perfect for:**

- Long-term projects
- API development
- Debugging production issues
- Performance optimization
- Test automation
- Team collaboration
