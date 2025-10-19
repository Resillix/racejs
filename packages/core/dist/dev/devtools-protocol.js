/**
 * DevTools Protocol
 *
 * Message types and data structures for WebSocket communication
 * between the DevTools server and browser client.
 */
/**
 * Message types sent from server to client
 */
export var ServerMessageType;
(function (ServerMessageType) {
    // Connection
    ServerMessageType["CONNECTED"] = "connected";
    ServerMessageType["PONG"] = "pong";
    ServerMessageType["SHUTDOWN"] = "shutdown";
    // Dashboard updates
    ServerMessageType["METRICS_UPDATE"] = "metrics_update";
    // Routes
    ServerMessageType["ROUTES_LIST"] = "routes_list";
    // Requests
    ServerMessageType["REQUEST_RECORDED"] = "request_recorded";
    ServerMessageType["REQUEST_RESPONSE"] = "request_response";
    ServerMessageType["REQUESTS_LIST"] = "requests_list";
    ServerMessageType["REQUEST_DETAILS"] = "request_details";
    ServerMessageType["REQUESTS_EXPORT"] = "requests_export";
    // Logs
    ServerMessageType["LOG_ENTRY"] = "log_entry";
    // Performance
    ServerMessageType["PERFORMANCE_UPDATE"] = "performance_update";
    ServerMessageType["PERFORMANCE_METRICS"] = "performance_metrics";
    ServerMessageType["PROFILING_STARTED"] = "profiling_started";
    ServerMessageType["PROFILING_STOPPED"] = "profiling_stopped";
    // Replay
    ServerMessageType["REPLAY_RESULT"] = "replay_result";
    ServerMessageType["REPLAY_COMPARISON"] = "replay_comparison";
    ServerMessageType["TEST_GENERATED"] = "test_generated";
    // Error Tracking (Phase 5)
    ServerMessageType["ERROR_TRACKED"] = "error_tracked";
    ServerMessageType["ERROR_LIST"] = "error_list";
    ServerMessageType["ERROR_DETAILS"] = "error_details";
    ServerMessageType["ERROR_STATS"] = "error_stats";
    ServerMessageType["ERROR_SPIKE_ALERT"] = "error_spike_alert";
    // Errors
    ServerMessageType["ERROR"] = "error";
})(ServerMessageType || (ServerMessageType = {}));
/**
 * Message types sent from client to server
 */
export var ClientMessageType;
(function (ClientMessageType) {
    // Initial connection
    ClientMessageType["HELLO"] = "hello";
    ClientMessageType["PING"] = "ping";
    // Data requests
    ClientMessageType["GET_METRICS"] = "get_metrics";
    ClientMessageType["GET_ROUTES"] = "get_routes";
    ClientMessageType["GET_REQUESTS"] = "get_requests";
    ClientMessageType["GET_REQUEST"] = "get_request";
    // Actions
    ClientMessageType["CLEAR_REQUESTS"] = "clear_requests";
    ClientMessageType["DELETE_REQUEST"] = "delete_request";
    ClientMessageType["EXPORT_REQUESTS"] = "export_requests";
    // Logs
    ClientMessageType["GET_LOGS"] = "get_logs";
    ClientMessageType["CLEAR_LOGS"] = "clear_logs";
    // Performance
    ClientMessageType["GET_PERFORMANCE"] = "get_performance";
    ClientMessageType["GET_PERFORMANCE_METRICS"] = "get_performance_metrics";
    ClientMessageType["START_PROFILING"] = "start_profiling";
    ClientMessageType["STOP_PROFILING"] = "stop_profiling";
    // Replay actions
    ClientMessageType["REPLAY_REQUEST"] = "replay_request";
    ClientMessageType["COMPARE_RESPONSES"] = "compare_responses";
    ClientMessageType["GENERATE_TEST"] = "generate_test";
    ClientMessageType["EDIT_AND_REPLAY"] = "edit_and_replay";
    // Error actions (Phase 5)
    ClientMessageType["GET_ERRORS"] = "get_errors";
    ClientMessageType["GET_ERROR_DETAILS"] = "get_error_details";
    ClientMessageType["GET_ERROR_STATS"] = "get_error_stats";
    ClientMessageType["MARK_ERROR_RESOLVED"] = "mark_error_resolved";
    ClientMessageType["MARK_ERROR_IGNORED"] = "mark_error_ignored";
    ClientMessageType["CLEAR_ERRORS"] = "clear_errors";
    ClientMessageType["EXPORT_ERRORS"] = "export_errors";
})(ClientMessageType || (ClientMessageType = {}));
/**
 * Helper to create server messages
 */
export function createServerMessage(type, data) {
    return {
        type,
        timestamp: Date.now(),
        id: generateMessageId(),
        data,
    };
}
/**
 * Helper to create client messages
 */
export function createClientMessage(type, data) {
    return {
        type,
        timestamp: Date.now(),
        id: generateMessageId(),
        data,
    };
}
/**
 * Generate unique message ID
 */
function generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
//# sourceMappingURL=devtools-protocol.js.map