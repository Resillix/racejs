/**
 * DevTools Message Handler
 *
 * Handles client messages and sends appropriate responses.
 * Bridges events from DevModeManager components to WebSocket clients.
 */
import type { DevToolsServer } from './devtools-server.js';
import type { DevModeManager } from './manager.js';
import type { ClientMessage } from './devtools-protocol.js';
/**
 * DevTools Message Handler
 *
 * Processes client messages and coordinates with DevModeManager
 * to fetch data and stream updates.
 */
export declare class DevToolsMessageHandler {
    private server;
    private devMode;
    constructor(server: DevToolsServer, devMode: DevModeManager);
    /**
     * Setup event listeners for real-time updates
     */
    private setupEventListeners;
    /**
     * Handle incoming client message
     */
    handleMessage(message: ClientMessage, client: any): Promise<void>;
    /**
     * Handle HELLO message
     */
    private handleHello;
    /**
     * Handle GET_METRICS message
     */
    private handleGetMetrics;
    /**
     * Handle GET_ROUTES message
     */
    private handleGetRoutes;
    /**
     * Handle GET_REQUESTS message
     */
    private handleGetRequests;
    /**
     * Handle GET_REQUEST message
     */
    private handleGetRequest;
    /**
     * Handle CLEAR_REQUESTS message
     */
    private handleClearRequests;
    /**
     * Handle DELETE_REQUEST message
     */
    private handleDeleteRequest;
    /**
     * Handle EXPORT_REQUESTS message
     */
    private handleExportRequests;
    /**
     * Broadcast metrics update to all clients
     */
    private broadcastMetrics;
    /**
     * Handle REPLAY_REQUEST message
     */
    private handleReplayRequest;
    /**
     * Handle COMPARE_RESPONSES message
     */
    private handleCompareResponses;
    /**
     * Handle GENERATE_TEST message
     */
    private handleGenerateTest;
    /**
     * Handle EDIT_AND_REPLAY message
     */
    private handleEditAndReplay;
    /**
     * Handle GET_PERFORMANCE_METRICS message
     */
    private handleGetPerformanceMetrics;
    /**
     * Handle START_PROFILING message
     */
    private handleStartProfiling;
    /**
     * Handle STOP_PROFILING message
     */
    private handleStopProfiling;
    /**
     * Handle GET_ERRORS message
     */
    private handleGetErrors;
    /**
     * Handle GET_ERROR_DETAILS message
     */
    private handleGetErrorDetails;
    /**
     * Handle GET_ERROR_STATS message
     */
    private handleGetErrorStats;
    /**
     * Handle MARK_ERROR_RESOLVED message
     */
    private handleMarkErrorResolved;
    /**
     * Handle MARK_ERROR_IGNORED message
     */
    private handleMarkErrorIgnored;
    /**
     * Handle CLEAR_ERRORS message
     */
    private handleClearErrors;
    /**
     * Handle EXPORT_ERRORS message
     */
    private handleExportErrors;
}
//# sourceMappingURL=devtools-handler.d.ts.map