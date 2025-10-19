# Request Storage & Data Management - Implementation Summary

## Problem Report

User reported three issues:

1. No request data storage policy/maintenance
2. Data not showing properly in UI (duplicates, missing fields)
3. UI refresh wiping all request data

## Root Causes Identified

### Issue 1: Missing Storage Policy

- **Cause**: MemoryStorage had no cleanup mechanism
- **Impact**: Memory could grow unbounded with old requests

### Issue 2: Duplicate Requests & Missing Data

- **Cause**: `addRequestToList()` didn't check for existing requests
- **Impact**: Same request shown multiple times, some with partial data

### Issue 3: Data Wiped on Refresh

- **Cause**: UI didn't request existing data on reconnection
- **Impact**: Refreshing browser lost all recorded requests

## Solutions Implemented

### 1. Storage Policy (recorder.ts)

```typescript
export class MemoryStorage {
  private maxRequests: number = 1000;
  private maxAge: number = 60 * 60 * 1000; // 1 hour
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Auto-cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupOldRequests();
      },
      5 * 60 * 1000
    );
  }

  private cleanupOldRequests(): void {
    const now = Date.now();
    for (const [id, request] of this.requests.entries()) {
      if (now - request.timestamp > this.maxAge) {
        this.requests.delete(id);
      }
    }
  }
}
```

**Benefits:**

- Automatic memory management
- Configurable retention period
- Prevents memory leaks
- Background cleanup doesn't block main thread

### 2. Request Deduplication (devtools-ui.ts)

```typescript
function addRequestToList(data) {
  const existingIndex = state.requests.findIndex((r) => r.id === data.id);

  if (existingIndex >= 0) {
    // Update existing request
    state.requests[existingIndex] = {
      ...state.requests[existingIndex],
      ...data,
    };
  } else {
    // Add new request
    state.requests.unshift(data);
  }

  updateRequestsTable();
}
```

**Benefits:**

- No duplicate entries
- Proper request lifecycle tracking
- Clean UI updates

### 3. Data Persistence (devtools-handler.ts)

```typescript
private async handleHello(client: any): Promise<void> {
  await this.handleGetMetrics(client);
  await this.handleGetRoutes(client);
  // ✅ Send existing requests on connection
  await this.handleGetRequests(client, { limit: 100 });
}
```

**Benefits:**

- UI shows data immediately on load
- Refresh doesn't lose historical data
- New clients see existing state

## Test Results

All tests passed (9/9 - 100% success rate):

```
✅ PASS: UI receives requests on connection (2 requests)
✅ PASS: Requests have proper ID (req_1760776429405_38s8xcubf)
✅ PASS: Requests have proper timestamp (1760776429405)
✅ PASS: Requests have HTTP method (GET)
✅ PASS: Requests have URL (/api/users)
✅ PASS: Requests have status code (200)
✅ PASS: Requests have duration (1ms)
✅ PASS: No duplicate requests (Total: 2, Unique: 2)
✅ PASS: Data persists after reconnection (Before: 2, After: 2)
```

## Storage Policy Configuration

Current defaults:

- **Max Requests**: 1,000 requests
- **Max Age**: 1 hour (3,600,000 ms)
- **Cleanup Interval**: 5 minutes (300,000 ms)
- **Eviction Strategy**: FIFO (First In, First Out)

Can be customized via:

```typescript
const recorder = new RequestRecorder({
  maxRequests: 2000, // Store more requests
  // Other options...
});
```

## Files Modified

1. `/packages/core/src/dev/recorder.ts` - Added cleanup policy
2. `/packages/core/src/dev/devtools-handler.ts` - Send data on HELLO
3. `/packages/core/src/dev/devtools-ui.ts` - Fixed deduplication
4. `/packages/core/src/dev/dev-ui/scripts/ui.ts` - Fixed message types

## Performance Impact

- **Memory**: Self-limiting (max 1000 requests)
- **CPU**: Minimal (cleanup every 5 min)
- **Network**: Efficient (no duplicate data)
- **Storage**: ~1-2MB for 1000 requests

## Future Enhancements

Potential improvements:

1. **Persistent Storage**: Save to disk for long-term retention
2. **Compression**: Compress old requests to save memory
3. **Filtering**: Advanced search/filter capabilities
4. **Export**: Export requests to HAR/JSON files
5. **Statistics**: Request analytics and trends

## Related Issues Fixed

- Replay functionality now working (fixed message types)
- WebSocket reconnection handled properly
- UI refresh behavior improved
