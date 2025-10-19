/**
 * Dev Mode - Main exports
 *
 * Zero-config developer experience features
 */

// Core dev mode
export { DevModeManager, createDevMode, type DevModeMetrics } from './manager.js';
export type { DevModeOptions } from './types.js';

// Logger
export {
  DevLogger,
  createDevLogger,
  ConsoleTransport,
  JsonTransport,
  type LogLevel,
  type LogContext,
  type LogEntry,
  type LogTransport,
  type DevLoggerOptions,
} from './logger.js';

// Request Recorder
export { RequestRecorder, createRequestRecorder } from './recorder-manager.js';
export { MemoryStorage, generateRequestId, extractBody, sanitizeHeaders } from './recorder.js';
export type { RecordedRequest, RecordedResponse, RecorderStorage } from './recorder.js';
export type { RequestRecorderOptions } from './recorder-manager.js';

// Phase 3: Request Replay & Advanced Recording
export { RequestReplayEngine } from './recorder-replay.js';
export type { ReplayOptions, ReplayResult, ResponseComparison } from './recorder-replay.js';
export { TestGenerator } from './recorder-test-gen.js';
export type { TestGenerationOptions, GeneratedTest } from './recorder-test-gen.js';
export { MemoryStorage as RecorderMemoryStorage, FileStorage } from './recorder-storage.js';
export type { StorageQuery, StorageConfig } from './recorder-storage.js';

// DevTools Server (internal - used by DevModeManager)
export { DevToolsServer } from './devtools-server.js';
export { DevToolsHttpServer } from './devtools-http.js';
export { DevToolsMessageHandler } from './devtools-handler.js';
export { generateDevToolsUI } from './devtools-ui.js';
export type {
  ServerMessage,
  ClientMessage,
  ServerMessageType,
  ClientMessageType,
} from './devtools-protocol.js';

// Configuration types
export type {
  DevToolsOptions,
  RecorderOptions,
  ProfilerOptions,
  ErrorHandlerOptions,
} from './types.js';
