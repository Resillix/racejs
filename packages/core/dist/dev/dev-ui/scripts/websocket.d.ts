/**
 * WebSocket Client - Real-time Communication with DevTools Server
 *
 * This module has been refactored to follow architectural principles:
 * - Separation of Concerns: Connection, State, Handlers, UI are separate
 * - Single Responsibility: Each module has one clear purpose
 * - Encapsulation: State is managed through controlled interfaces
 * - Security: Safe DOM manipulation, XSS prevention
 * - Testability: Modular structure allows isolated testing
 * - Observability: Structured logging throughout
 *
 * Architecture:
 * - websocket/index.ts: Main orchestration module
 * - websocket/connection.ts: WebSocket lifecycle management
 * - websocket/state.ts: Encapsulated state management
 * - websocket/protocol.ts: Type contracts and validation
 * - websocket/handlers/: Domain-specific message handlers
 * - websocket/ui/: Safe UI rendering
 * - websocket/utils/: Logger, sanitizer, formatters, retry logic
 */
export { generateWebSocketClient } from './websocket/index.js';
/**
 * Legacy export for backward compatibility
 * @deprecated Use named export from ./websocket/index instead
 */
export declare function generateWebSocketClientLegacy(): string;
//# sourceMappingURL=websocket.d.ts.map