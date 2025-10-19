# 🚀 RaceJS Dev Mode - Complete Implementation Plan

**Goal:** Implement the most advanced developer experience in any Node.js framework

**Reference:** `plan/devResearch.md`

---

## 📊 Current Status (Phase 2 Complete)

### ✅ Completed (~30% of total features)

1. **Dev Logger** ✅ - Structured logging with transports (266 lines)
2. **Dev Manager** ✅ - Central orchestrator with metrics (291 lines)
3. **Request Recorder** ✅ - Basic recording with memory storage (508 lines)
4. **DevTools Server** ✅ - WebSocket + HTTP server (437 lines)
5. **DevTools Protocol** ✅ - Message types for real-time communication (305 lines)
6. **DevTools Handler** ✅ - Message processing & event bridging (346 lines)
7. **DevTools UI** ✅ - Basic browser interface with 3 tabs (850 lines)

**Total:** ~3,000 lines of production code

---

## 🎯 Implementation Strategy

### Architecture Principles (Clean Code)

1. **Single Responsibility Principle (SRP)**
   - Each module handles ONE concern
   - Clear separation: profiler.ts, error-handler.ts, schema-inspector.ts, etc.

2. **Open/Closed Principle (OCP)**
   - Extensible through interfaces (Storage, Transport, Exporter)
   - Plugin architecture for AI providers, ORMs, etc.

3. **Dependency Inversion Principle (DIP)**
   - Depend on abstractions, not concretions
   - Use interfaces for all external dependencies

4. **Interface Segregation Principle (ISP)**
   - Small, focused interfaces
   - Optional features don't force dependencies

5. **Event-Driven Architecture**
   - EventEmitter for loose coupling
   - Easy to add new features without touching existing code

### Token Budget Strategy

- **Per Session:** ~40,000 tokens (safe limit)
- **Per Phase:** 2-4 modules
- **Per Module:** 200-500 lines of code
- **Testing:** Create examples with each phase

---

## 📋 Phase 3: Request Replay & Advanced Recording

**Goal:** Complete the "Time-Travel Debugging" killer feature

**Estimated:** 800 lines | 1 session | Priority: HIGH

### 3.1 Request Replay Engine (`recorder-replay.ts`)

**Clean Code:** Single Responsibility - handles ONLY replay logic

```typescript
// Features:
- Replay recorded request with exact conditions
- Edit request before replay (headers, body, query)
- Compare responses (before/after code changes)
- Generate cURL commands
- Mock mode (don't send real request)
```

**Files:**

- `packages/core/src/dev/recorder-replay.ts` (300 lines)
  - `RequestReplayEngine` class
  - `replayRequest()` method
  - `compareResponses()` method
  - `generateCurl()` utility
  - Response diffing algorithm

**Integration:**

- Add to `RecordedRequest` interface: `replay()` method
- Wire into DevModeManager
- Add DevTools protocol messages: `REPLAY_REQUEST`, `COMPARE_RESPONSES`

### 3.2 Storage Implementations (`recorder-storage.ts`)

**Clean Code:** Strategy Pattern - swap storage backends

```typescript
// Implementations:
-SQLiteStorage(persistent, efficient) -
  RedisStorage(distributed, fast) -
  FileStorage(simple, backup - friendly);
```

**Files:**

- `packages/core/src/dev/recorder-storage.ts` (400 lines)
  - `SQLiteStorage` class using `better-sqlite3`
  - `RedisStorage` class using `ioredis`
  - Migration from memory to persistent storage
  - Async API with Promises

**Dependencies:**

- `better-sqlite3` (optional peer dependency)
- `ioredis` (optional peer dependency)

### 3.3 Test Generation (`recorder-test-gen.ts`)

**Clean Code:** Factory Pattern - generate different test formats

```typescript
// Features:
- Generate Vitest test cases from recordings
- Generate Jest test cases
- Generate Postman collections
- Generate HTTP Archive (HAR) format
```

**Files:**

- `packages/core/src/dev/recorder-test-gen.ts` (100 lines)
  - `generateVitestTest()` function
  - `generatePostmanCollection()` function
  - `generateHARFile()` function

### 3.4 DevTools UI Updates

**Updates to `devtools-ui.ts`:**

- Add Replay button to Requests tab
- Add Edit & Replay modal
- Add Compare mode with diff viewer
- Add Export dropdown (cURL, Postman, Tests)

**Estimated:** +200 lines to existing UI

### Clean Code Checklist

- ✅ Each storage backend is a separate class (SRP)
- ✅ Common interface `RecorderStorage` (DIP)
- ✅ Replay engine doesn't know about storage (loose coupling)
- ✅ Test generation is pure functions (testability)

---

## 📋 Phase 4: Performance Profiler

**Goal:** CPU, memory, and event loop monitoring

**Estimated:** 1,000 lines | 1-2 sessions | Priority: HIGH

### 4.1 Core Profiler (`profiler.ts`)

**Clean Code:** Facade Pattern - simple API, complex internals

```typescript
// Features:
- CPU profiling per route using Node's profiler API
- Memory heap snapshots using v8.writeHeapSnapshot()
- Event loop lag detection using perf_hooks
- Async operation tracking
- Performance budgets with alerts
```

**Files:**

- `packages/core/src/dev/profiler.ts` (400 lines)
  - `PerformanceProfiler` class extends EventEmitter
  - `startCPUProfile()` / `stopCPUProfile()`
  - `takeHeapSnapshot()`
  - `monitorEventLoop()`
  - `checkBudgets()` - alert if route exceeds budget
  - Events: `budget-exceeded`, `slow-route`, `memory-leak`

**Node.js APIs:**

- `node:inspector` for CPU profiling
- `node:v8` for heap snapshots
- `node:perf_hooks` for event loop monitoring

### 4.2 Middleware Timing Tracker (`profiler-middleware.ts`)

**Clean Code:** Decorator Pattern - wrap middleware for timing

```typescript
// Features:
- Track execution time per middleware
- Visualize middleware pipeline
- Detect slow middleware
- Waterfall chart data
```

**Files:**

- `packages/core/src/dev/profiler-middleware.ts` (200 lines)
  - `wrapMiddleware()` function
  - `MiddlewareTimeline` class
  - Integration with Router

### 4.3 Flame Graph Generator (`profiler-flamegraph.ts`)

**Clean Code:** Builder Pattern - construct flame graph data

```typescript
// Features:
- Parse CPU profile to flame graph format
- Generate D3.js compatible data
- Export to speedscope format
```

**Files:**

- `packages/core/src/dev/profiler-flamegraph.ts` (150 lines)
  - `parseProfile()` function
  - `generateFlameGraphData()` function
  - `exportToSpeedscope()` function

### 4.4 Performance Metrics Collector (`profiler-metrics.ts`)

**Clean Code:** Observer Pattern - collect metrics without coupling

```typescript
// Features:
- P50, P95, P99 latency tracking
- Request rate calculation (req/s)
- Error rate tracking
- Memory usage trends
- Historical data (last 1h, 24h, 7d)
```

**Files:**

- `packages/core/src/dev/profiler-metrics.ts` (250 lines)
  - `MetricsCollector` class
  - `calculatePercentiles()` method
  - `trackTrend()` method
  - Ring buffer for efficient storage

### 4.5 DevTools UI Updates

**New Tab: Performance**

- Real-time latency chart
- P95/P99 metrics cards
- Flame graph viewer (interactive)
- Middleware waterfall
- Memory usage graph
- Event loop lag indicator

**Estimated:** +400 lines to UI

### Clean Code Checklist

- ✅ Profiler doesn't depend on DevTools (can run standalone)
- ✅ Each profiling method is independent (SRP)
- ✅ Metrics collector is reusable (DIP)
- ✅ No blocking operations (async/event-driven)

---

## 📋 Phase 5: Error Handler & Aggregation

**Goal:** Beautiful error pages and error tracking

**Estimated:** 800 lines | 1 session | Priority: MEDIUM

### 5.1 Enhanced Error Handler (`error-handler.ts`)

**Clean Code:** Strategy Pattern - different error formats

```typescript
// Features:
- Beautiful HTML error pages in dev mode
- Source code context (show lines around error)
- Stack trace enhancement with source maps
- Syntax highlighting
- Similar error suggestions (AI optional)
```

**Files:**

- `packages/core/src/dev/error-handler.ts` (400 lines)
  - `DevErrorHandler` class
  - `renderErrorPage()` method - generates HTML
  - `enhanceStackTrace()` method - adds source maps
  - `getSourceContext()` method - reads file around error
  - `findSimilarErrors()` method - pattern matching

**Dependencies:**

- `source-map-support` (parse source maps)
- `highlight.js` (syntax highlighting in error pages)

### 5.2 Error Aggregator (`error-aggregator.ts`)

**Clean Code:** Repository Pattern - store and query errors

```typescript
// Features:
- Group similar errors together
- Track error frequency
- Error trends over time
- Export to Sentry/Bugsnag/etc
```

**Files:**

- `packages/core/src/dev/error-aggregator.ts` (300 lines)
  - `ErrorAggregator` class
  - `trackError()` method
  - `groupSimilar()` method - group by stack trace hash
  - `getErrorStats()` method
  - Integration with error tracking services

### 5.3 DevTools UI Updates

**New Tab: Errors**

- Error list with grouping
- Error details with stack trace
- Source code viewer
- Error frequency chart
- Filter by status code, route, time range

**Estimated:** +100 lines to UI

### Clean Code Checklist

- ✅ Error handler is middleware (standard interface)
- ✅ Aggregator is storage-agnostic (DIP)
- ✅ Rendering logic separate from data logic (SRP)
- ✅ Optional AI suggestions (ISP)

---

## 📋 Phase 6: Schema Inspector & OpenAPI

**Goal:** Auto-generate API documentation from runtime

**Estimated:** 1,000 lines | 1-2 sessions | Priority: HIGH

### 6.1 Schema Detector (`schema-inspector.ts`)

**Clean Code:** Observer Pattern - learn from real traffic

```typescript
// Features:
- Detect request/response schemas from recorded requests
- Infer types (string, number, boolean, object, array)
- Detect required vs optional fields
- Generate JSON Schema
- Generate TypeScript types
```

**Files:**

- `packages/core/src/dev/schema-inspector.ts` (400 lines)
  - `SchemaInspector` class
  - `inferSchema()` method - analyze request/response
  - `mergeSchemas()` method - combine multiple examples
  - `generateJSONSchema()` method
  - `generateTypeScript()` method

**Algorithm:**

- Analyze 10+ requests per route to infer schema
- Track type variations (nullable, unions)
- Confidence score (how sure we are)

### 6.2 OpenAPI Generator (`schema-openapi.ts`)

**Clean Code:** Builder Pattern - construct OpenAPI spec

```typescript
// Features:
- Generate OpenAPI 3.1 spec from routes
- Include request/response schemas
- Add examples from recorded requests
- Parameter documentation
- Response status codes
```

**Files:**

- `packages/core/src/dev/schema-openapi.ts` (400 lines)
  - `OpenAPIGenerator` class
  - `generateSpec()` method
  - `addRoute()` method
  - `addSchema()` method
  - Export to JSON/YAML

**Integration:**

- Read routes from Router
- Use SchemaInspector for schemas
- Use RecordedRequests for examples

### 6.3 Breaking Change Detector (`schema-diff.ts`)

**Clean Code:** Strategy Pattern - different diff strategies

```typescript
// Features:
- Compare old vs new OpenAPI specs
- Detect breaking changes (removed fields, type changes)
- Detect backward-compatible changes (new fields)
- Generate migration guide
```

**Files:**

- `packages/core/src/dev/schema-diff.ts` (200 lines)
  - `detectBreakingChanges()` function
  - `diffSchemas()` function
  - `generateMigrationGuide()` function

### 6.4 DevTools UI Updates

**New Tab: OpenAPI**

- Live OpenAPI spec viewer
- Interactive "Try It" functionality
- Schema explorer with examples
- Export spec (JSON/YAML)
- Breaking changes alerts

**Estimated:** +300 lines to UI

### Clean Code Checklist

- ✅ Schema detection is pure (no side effects)
- ✅ OpenAPI generator follows spec exactly
- ✅ Breaking change detection is testable
- ✅ Works without DevTools UI (CLI friendly)

---

## 📋 Phase 7: Database Inspector

**Goal:** Query logging, N+1 detection, ORM integration

**Estimated:** 1,200 lines | 2 sessions | Priority: MEDIUM

### 7.1 Database Adapter System (`db-inspector.ts`)

**Clean Code:** Adapter Pattern - support multiple ORMs

```typescript
// Supported ORMs:
- Prisma
- TypeORM
- Sequelize
- Mongoose
- Drizzle ORM
- Raw SQL (pg, mysql2, better-sqlite3)
```

**Files:**

- `packages/core/src/dev/db-inspector.ts` (300 lines)
  - `DatabaseInspector` class
  - `detectORM()` method - auto-detect from dependencies
  - `startLogging()` method
  - Events: `query-executed`, `slow-query`, `n-plus-one-detected`

### 7.2 ORM Adapters (`db-adapters/`)

**Clean Code:** Adapter Pattern - uniform interface

**Files:**

- `packages/core/src/dev/db-adapters/prisma.ts` (150 lines)
- `packages/core/src/dev/db-adapters/typeorm.ts` (150 lines)
- `packages/core/src/dev/db-adapters/sequelize.ts` (150 lines)
- `packages/core/src/dev/db-adapters/mongoose.ts` (150 lines)

**Each adapter implements:**

```typescript
interface DatabaseAdapter {
  connect(): void;
  logQuery(query: string, params: any[], duration: number): void;
  disconnect(): void;
}
```

### 7.3 N+1 Query Detector (`db-n-plus-one.ts`)

**Clean Code:** Observer Pattern - detect patterns

```typescript
// Algorithm:
- Track queries per request
- Detect loop patterns (same query multiple times)
- Alert when N+1 detected
- Suggest solution (use JOIN or eager loading)
```

**Files:**

- `packages/core/src/dev/db-n-plus-one.ts` (200 lines)
  - `NPlusOneDetector` class
  - `analyzeQueries()` method
  - `detectLoop()` method
  - `suggestFix()` method

### 7.4 Query Analyzer (`db-analyzer.ts`)

**Clean Code:** Strategy Pattern - different analysis methods

```typescript
// Features:
- Slow query detection
- Query frequency tracking
- Index suggestions (for SQL)
- Query optimization hints
```

**Files:**

- `packages/core/src/dev/db-analyzer.ts` (250 lines)
  - `QueryAnalyzer` class
  - `analyzeQuery()` method
  - `suggestIndexes()` method
  - `explainQuery()` method - uses EXPLAIN for SQL

### 7.5 DevTools UI Updates

**New Tab: Database**

- Query log with filtering
- Slow query alerts
- N+1 detection warnings
- Query distribution chart
- Index suggestions

**Estimated:** +150 lines to UI

### Clean Code Checklist

- ✅ ORM adapters follow common interface (DIP)
- ✅ Inspector doesn't know about specific ORMs (OCP)
- ✅ N+1 detector is reusable (SRP)
- ✅ Optional feature - doesn't break without DB (ISP)

---

## 📋 Phase 8: Network Tracer & OpenTelemetry

**Goal:** Distributed tracing for microservices

**Estimated:** 1,000 lines | 1-2 sessions | Priority: MEDIUM

### 8.1 HTTP Request Tracer (`network-tracer.ts`)

**Clean Code:** Proxy Pattern - intercept outgoing requests

```typescript
// Features:
- Trace all outgoing HTTP requests
- Monkey-patch: http.request, https.request, fetch
- Support popular libraries: axios, got, node-fetch
- Track request/response timing
- Dependency graph visualization
```

**Files:**

- `packages/core/src/dev/network-tracer.ts` (400 lines)
  - `NetworkTracer` class
  - `patchHttp()` method - monkey-patch native modules
  - `patchFetch()` method
  - `patchAxios()` method
  - `trackRequest()` method
  - Events: `outgoing-request`, `outgoing-response`

### 8.2 OpenTelemetry Integration (`telemetry.ts`)

**Clean Code:** Adapter Pattern - standard telemetry interface

```typescript
// Features:
- OpenTelemetry SDK integration
- Automatic span creation per request
- Distributed trace ID propagation
- Support exporters: Console, Jaeger, Zipkin, OTLP
```

**Files:**

- `packages/core/src/dev/telemetry.ts` (400 lines)
  - `TelemetryManager` class
  - `createSpan()` method
  - `configureExporter()` method
  - Integration with incoming/outgoing requests

**Dependencies:**

- `@opentelemetry/api` (peer dependency)
- `@opentelemetry/sdk-node` (peer dependency)
- `@opentelemetry/exporter-jaeger` (optional peer)

### 8.3 Service Dependency Graph (`network-graph.ts`)

**Clean Code:** Builder Pattern - construct graph from traces

```typescript
// Features:
- Build service dependency graph
- Visualize microservice architecture
- Detect circular dependencies
- Performance hotspots
```

**Files:**

- `packages/core/src/dev/network-graph.ts` (200 lines)
  - `DependencyGraph` class
  - `addNode()` method
  - `addEdge()` method
  - `detectCycles()` method
  - Export to D3.js format

### 8.4 DevTools UI Updates

**New Tab: Network**

- Outgoing request log
- Service dependency graph (interactive)
- Trace timeline (waterfall)
- Distributed trace viewer
- Export traces

**Estimated:** +200 lines to UI

### Clean Code Checklist

- ✅ Tracer doesn't modify application code (Proxy pattern)
- ✅ OpenTelemetry is optional (ISP)
- ✅ Exporters are pluggable (Strategy pattern)
- ✅ Works in distributed systems

---

## 📋 Phase 9: AI Assistant (Optional)

**Goal:** AI-powered insights and suggestions

**Estimated:** 800 lines | 1 session | Priority: LOW

### 9.1 AI Provider System (`ai-assistant.ts`)

**Clean Code:** Strategy Pattern - swap AI providers

```typescript
// Supported:
- Anthropic Claude
- OpenAI GPT-4
- Local models (Ollama)
```

**Files:**

- `packages/core/src/dev/ai-assistant.ts` (300 lines)
  - `AIAssistant` class
  - `analyzeError()` method
  - `suggestOptimization()` method
  - `detectVulnerabilities()` method
  - `generateTests()` method

### 9.2 AI Features

**Error Analysis:**

- Parse error message and stack trace
- Search similar errors in knowledge base
- Suggest fixes with code examples

**Performance Optimization:**

- Analyze slow routes
- Suggest caching strategies
- Recommend algorithm improvements

**Security Scanning:**

- Detect SQL injection risks
- Identify XSS vulnerabilities
- Check for outdated dependencies

**Test Generation:**

- Generate test cases from recorded requests
- Cover edge cases
- Include assertions

**Files:**

- `packages/core/src/dev/ai-providers/anthropic.ts` (150 lines)
- `packages/core/src/dev/ai-providers/openai.ts` (150 lines)
- `packages/core/src/dev/ai-providers/ollama.ts` (100 lines)

### 9.3 DevTools UI Updates

**AI Panel (side panel on all tabs):**

- Show AI insights contextually
- "Ask AI" input box
- Suggestion cards with code snippets
- Copy to clipboard

**Estimated:** +100 lines to UI

### Clean Code Checklist

- ✅ Completely optional (ISP)
- ✅ Provider-agnostic (Strategy pattern)
- ✅ No vendor lock-in
- ✅ Works offline with local models

---

## 📋 Phase 10: Dev CLI & REPL

**Goal:** Interactive command-line interface

**Estimated:** 600 lines | 1 session | Priority: MEDIUM

### 10.1 Interactive CLI (`cli.ts`)

**Clean Code:** Command Pattern - each command is a class

```typescript
// Commands:
- racejs dev           # Start dev mode
- racejs replay <id>   # Replay request
- racejs export        # Export recordings
- racejs profile       # Start profiling
- racejs docs          # Generate OpenAPI
- racejs health        # Health check
```

**Files:**

- `packages/core/src/dev/cli.ts` (400 lines)
  - `DevCLI` class
  - Command registry
  - Interactive prompts using `inquirer`
  - Keyboard shortcuts

**Dependencies:**

- `commander` (CLI framework)
- `inquirer` (interactive prompts)
- `chalk` (colors)

### 10.2 REPL Integration (`repl.ts`)

**Clean Code:** Facade Pattern - simple API to complex system

```typescript
// Features:
- Test routes interactively
- Access app instance
- Execute JavaScript in context
- Auto-completion
```

**Files:**

- `packages/core/src/dev/repl.ts` (200 lines)
  - `startREPL()` function
  - Context injection (app, devMode, logger)
  - Custom commands (.routes, .metrics, etc.)

### Clean Code Checklist

- ✅ Each command is independent (SRP)
- ✅ CLI doesn't know about internals (facade)
- ✅ REPL is optional feature (ISP)
- ✅ Works without DevTools UI

---

## 📋 Phase 11: DevTools UI - Advanced Features

**Goal:** Polish and enhance the browser interface

**Estimated:** 1,000 lines | 1-2 sessions | Priority: HIGH

### 11.1 Enhanced Dashboard Tab

**Features:**

- Real-time charts (Chart.js or D3.js)
- Customizable widgets
- Drag-and-drop layout
- Performance alerts
- Quick actions (clear cache, restart, etc.)

**Estimated:** +300 lines

### 11.2 Middleware Tab

**Features:**

- Visualize middleware pipeline
- Show execution order
- Timing breakdown per middleware
- Waterfall chart
- Middleware source code viewer

**Estimated:** +200 lines

### 11.3 Console Tab (REPL in Browser)

**Features:**

- Execute JavaScript remotely via WebSocket
- Auto-completion
- Command history
- Access to app, req, res objects
- Code highlighting

**Estimated:** +300 lines

### 11.4 Settings Panel

**Features:**

- Toggle features on/off
- Configure recording options
- Set performance budgets
- Dark/light theme
- Export/import configuration

**Estimated:** +200 lines

### Clean Code Checklist

- ✅ Components are modular (SRP)
- ✅ State management (consider using Zustand/Nanostores)
- ✅ Responsive design
- ✅ Accessibility (WCAG AA)

---

## 📋 Phase 12: Documentation & Examples

**Goal:** Comprehensive guides and examples

**Estimated:** 500 lines | 1 session | Priority: HIGH

### 12.1 Developer Guide

**Files:**

- `docs/guides/DEV-MODE.md` (comprehensive guide)
  - Quick start
  - Configuration options
  - Feature overview
  - Best practices
  - Troubleshooting

### 12.2 API Reference

**Files:**

- `docs/api/dev-mode-api.md` (API documentation)
  - All public methods
  - Type definitions
  - Code examples

### 12.3 Examples

**Files:**

- `examples/08-dev-mode/complete.js` (all features demo)
- `examples/08-dev-mode/replay.js` (time-travel debugging)
- `examples/08-dev-mode/profiling.js` (performance monitoring)
- `examples/08-dev-mode/openapi.js` (auto-docs)
- `examples/08-dev-mode/database.js` (with Prisma)
- `examples/08-dev-mode/microservices.js` (distributed tracing)

### 12.4 Video Tutorials

**Content:**

- Getting started (5 min)
- Time-travel debugging (10 min)
- Performance optimization (15 min)
- Database N+1 detection (10 min)

---

## 📊 Implementation Timeline

### Summary by Phase

| Phase | Feature              | Lines | Sessions | Priority | Dependencies |
| ----- | -------------------- | ----- | -------- | -------- | ------------ |
| 3     | Request Replay       | 800   | 1        | HIGH     | Phase 2 ✅   |
| 4     | Performance Profiler | 1,000 | 1-2      | HIGH     | Phase 1 ✅   |
| 5     | Error Handler        | 800   | 1        | MEDIUM   | Phase 1 ✅   |
| 6     | Schema Inspector     | 1,000 | 1-2      | HIGH     | Phase 3      |
| 7     | Database Inspector   | 1,200 | 2        | MEDIUM   | Phase 4      |
| 8     | Network Tracer       | 1,000 | 1-2      | MEDIUM   | Phase 4      |
| 9     | AI Assistant         | 800   | 1        | LOW      | All features |
| 10    | Dev CLI & REPL       | 600   | 1        | MEDIUM   | Phase 1 ✅   |
| 11    | UI Advanced          | 1,000 | 1-2      | HIGH     | Phases 3-8   |
| 12    | Documentation        | 500   | 1        | HIGH     | All features |

**Total:** ~8,700 new lines of code
**Sessions:** ~13-18 sessions
**Timeline:** 3-4 weeks (part-time)

---

## 🎯 Recommended Order

### Week 1 (Foundation Completion)

1. **Phase 3** - Request Replay (unlock killer feature)
2. **Phase 4** - Performance Profiler (critical feature)
3. **Phase 5** - Error Handler (improves DX immediately)

### Week 2 (Advanced Features)

4. **Phase 6** - Schema Inspector & OpenAPI (unique feature)
5. **Phase 7** - Database Inspector (N+1 detection)
6. **Phase 10** - Dev CLI (improve workflow)

### Week 3 (Integration & Polish)

7. **Phase 8** - Network Tracer & OpenTelemetry
8. **Phase 11** - DevTools UI Advanced Features

### Week 4 (Optional & Documentation)

9. **Phase 9** - AI Assistant (optional premium feature)
10. **Phase 12** - Documentation & Examples

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Application                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              DevModeManager (Hub)                  │  │
│  │  - Orchestrates all dev features                  │  │
│  │  - EventEmitter-based messaging                   │  │
│  │  - Lifecycle management (start/stop)              │  │
│  └───────────┬──────────────────────────────────────┘  │
│              │                                           │
│  ┌───────────┴────────────┬──────────────┬────────────┐│
│  │                        │              │            ││
│  ▼                        ▼              ▼            ││
│ ┌─────────┐  ┌──────────────┐  ┌──────────────┐     ││
│ │ Logger  │  │ Recorder     │  │ Profiler     │     ││
│ │ Console │  │ Memory/SQLite│  │ CPU/Memory   │     ││
│ │ JSON    │  │ Replay       │  │ Event Loop   │     ││
│ └─────────┘  └──────────────┘  └──────────────┘     ││
│                                                        ││
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ ││
│  │ Error Handler│  │ Schema       │  │ Database   │ ││
│  │ Pretty Pages │  │ Inspector    │  │ Inspector  │ ││
│  │ Aggregation  │  │ OpenAPI Gen  │  │ N+1 Detect │ ││
│  └──────────────┘  └──────────────┘  └────────────┘ ││
│                                                        ││
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ ││
│  │ Network      │  │ AI Assistant │  │ Dev CLI    │ ││
│  │ Tracer       │  │ (Optional)   │  │ REPL       │ ││
│  │ OpenTelemetry│  │ Claude/GPT   │  │ Commands   │ ││
│  └──────────────┘  └──────────────┘  └────────────┘ ││
│                                                        ││
│  ┌──────────────────────────────────────────────────┐ ││
│  │           DevTools Server (WebSocket + HTTP)     │ ││
│  │  - Real-time bidirectional communication         │ ││
│  │  - Serves browser UI                             │ ││
│  │  - Protocol handlers                             │ ││
│  └──────────────────────────────────────────────────┘ ││
└────────────────────────────────┬─────────────────────┘│
                                 │                        │
                                 ▼                        │
              ┌──────────────────────────────────┐       │
              │     Browser DevTools UI          │       │
              │  - Dashboard, Routes, Requests   │       │
              │  - Errors, Performance, Database │       │
              │  - Network, OpenAPI, Console     │       │
              └──────────────────────────────────┘       │
```

---

## 💡 Clean Code Principles Applied

### 1. Single Responsibility (SRP)

- ✅ Logger only logs
- ✅ Recorder only records
- ✅ Profiler only profiles
- ✅ Each module = one purpose

### 2. Open/Closed (OCP)

- ✅ Storage interface (memory, SQLite, Redis)
- ✅ Transport interface (console, JSON, file)
- ✅ AI provider interface (Anthropic, OpenAI, Ollama)
- ✅ Database adapter interface (Prisma, TypeORM, etc.)

### 3. Liskov Substitution (LSP)

- ✅ All storage implementations interchangeable
- ✅ All transports behave consistently
- ✅ All AI providers have same API

### 4. Interface Segregation (ISP)

- ✅ Optional features don't force dependencies
- ✅ Can use logger without profiler
- ✅ Can use recorder without AI
- ✅ DevTools UI optional

### 5. Dependency Inversion (DIP)

- ✅ Depend on interfaces, not implementations
- ✅ Manager depends on abstract Storage, not MemoryStorage
- ✅ Profiler depends on abstract Exporter

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

- Test each module independently
- Mock dependencies using interfaces
- 80%+ code coverage

### Integration Tests

- Test module interactions
- Test DevModeManager orchestration
- Test WebSocket protocol

### E2E Tests (Playwright)

- Test browser UI
- Test WebSocket connection
- Test all tabs and features

### Performance Tests

- Benchmark overhead (<5% latency)
- Memory usage tests
- Stress tests (1000 req/s)

---

## 📦 Dependencies Summary

### Required Dependencies

- `ws` - WebSocket server ✅ (already added)
- `source-map-support` - Stack trace enhancement

### Optional Peer Dependencies

- `better-sqlite3` - SQLite storage
- `ioredis` - Redis storage
- `@opentelemetry/api` - OpenTelemetry
- `@opentelemetry/sdk-node` - OpenTelemetry SDK

### Dev Dependencies

- `vitest` - Testing framework
- `@types/*` - TypeScript types

---

## 🚀 Success Metrics

### Performance

- ✅ <5% overhead in dev mode
- ✅ <2ms latency added per request
- ✅ <100MB memory usage

### Developer Experience

- ✅ Zero-config setup
- ✅ <5 minutes to first insight
- ✅ Beautiful, intuitive UI
- ✅ Works across all frameworks

### Features

- ✅ Time-travel debugging (unique!)
- ✅ OpenAPI auto-generation
- ✅ N+1 query detection
- ✅ Distributed tracing
- ✅ AI-powered insights

---

## 📝 Notes

1. **Token Budget:** Each phase designed for ~40K tokens
2. **Modularity:** Can implement phases in any order (mostly)
3. **Testing:** Create examples with each phase
4. **Documentation:** Update docs as we go
5. **Backward Compatibility:** All features optional

---

## 🎯 Next Action

**Start with Phase 3: Request Replay**

- Most requested feature
- Builds on existing recorder
- Unlocks "time-travel debugging" marketing
- Clear deliverable: Replay button in UI

**Command to begin:**

```bash
# I'm ready when you are!
# Let's build the most advanced dev mode in Node.js! 🚀
```

---

_This plan covers 100% of features from `devResearch.md` while maintaining clean code principles and realistic token budgets._
