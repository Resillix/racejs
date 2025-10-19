/\*\*

- Request Data Storage and Management Improvements
-
- PROBLEMS IDENTIFIED:
- 1.  Timestamp issues - using performance.now() vs Date.now()
- 2.  UI not properly handling request updates
- 3.  Data not persisting across UI refresh
- 4.  Duplicate request entries
-
- SOLUTIONS:
- 1.  Fix timestamp handling - use Date.now() consistently
- 2.  Improve UI request deduplication and update logic
- 3.  Send full request list on reconnection
- 4.  Add proper request lifecycle management
      \*/

// File: packages/core/src/dev/recorder-manager.ts
// ISSUE: Using performance timestamps which aren't comparable to Date.now()

// BEFORE (Line ~110):
async recordRequest(req: IncomingMessage, startTime: number): Promise<string | null> {
// startTime might be performance.now() or Date.now() - inconsistent!
const recorded: RecordedRequest = {
id,
timestamp: startTime, // ❌ PROBLEM: Mixed time sources
...
};
}

// AFTER - Use Date.now() consistently:
async recordRequest(req: IncomingMessage): Promise<string | null> {
const startTime = Date.now(); // ✅ Always use Date.now()

    const recorded: RecordedRequest = {
      id,
      timestamp: startTime,
      ...
    };

}

// File: packages/core/src/dev/devtools-handler.ts
// ISSUE: Not sending request list on new connections

// ADD after HELLO handling (Line ~230):
private async handleHello(client: any): Promise<void> {
// Send initial metrics
await this.handleGetMetrics(client);

    // Send routes list
    await this.handleGetRoutes(client);

    // ✅ FIX: Send existing requests on connection
    await this.handleGetRequests(client, { limit: 100 });

}

// File: packages/core/src/dev/dev-ui/scripts/websocket.ts
// ISSUE: Request list not deduplicating properly

// ADD request deduplication logic:
function handleRequestRecorded(data) {
// Check if request already exists
const existingIndex = state.requests.findIndex(r => r.id === data.id);

    if (existingIndex >= 0) {
        // Update existing request
        state.requests[existingIndex] = {
            ...state.requests[existingIndex],
            ...data
        };
    } else {
        // Add new request
        state.requests.unshift(data);
    }

    // Limit size
    if (state.requests.length > 100) {
        state.requests = state.requests.slice(0, 100);
    }

    updateRequestsTable();

}

// STORAGE POLICY RECOMMENDATIONS:
// 1. Default: Keep last 1000 requests in memory
// 2. Optional: Persist to file for longer retention
// 3. Auto-cleanup: Remove requests older than 1 hour
// 4. Size limit: Cap at 100MB total storage

export const STORAGE_POLICY = {
maxRequests: 1000,
maxAge: 60 _ 60 _ 1000, // 1 hour
maxStorageSize: 100 _ 1024 _ 1024, // 100MB
cleanupInterval: 5 _ 60 _ 1000, // Cleanup every 5 minutes
};
