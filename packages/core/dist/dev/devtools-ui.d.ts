/**
 * DevTools UI - Embedded HTML Dashboard
 *
 * Modern, responsive browser-based UI for RaceJS DevTools.
 * Features: Dashboard, Routes, Requests, Logs with real-time WebSocket updates.
 *
 * Note: This file is now a re-export of the modular UI structure.
 * The actual UI components are in the dev-ui/ directory.
 */
export { generateDevToolsUI } from './dev-ui/index.js';
/**
 * Legacy export for backwards compatibility
 * @deprecated Use the modular structure in dev-ui/ instead
 */
export declare function generateDevToolsUILegacy(): string;
//# sourceMappingURL=devtools-ui.d.ts.map