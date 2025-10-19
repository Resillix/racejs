/**
 * DevTools Protocol
 *
 * Message types and data structures for WebSocket communication
 * between the DevTools server and browser client.
 */

/**
 * Message types sent from server to client
 */
export enum ServerMessageType {
  // Connection
  CONNECTED = 'connected',
  PONG = 'pong',
  SHUTDOWN = 'shutdown',

  // Dashboard updates
  METRICS_UPDATE = 'metrics_update',

  // Routes
  ROUTES_LIST = 'routes_list',

  // Requests
  REQUEST_RECORDED = 'request_recorded',
  REQUEST_RESPONSE = 'request_response',
  REQUESTS_LIST = 'requests_list',
  REQUEST_DETAILS = 'request_details',
  REQUESTS_EXPORT = 'requests_export',

  // Logs
  LOG_ENTRY = 'log_entry',

  // Performance
  PERFORMANCE_UPDATE = 'performance_update',
  PERFORMANCE_METRICS = 'performance_metrics',
  PROFILING_STARTED = 'profiling_started',
  PROFILING_STOPPED = 'profiling_stopped',

  // Replay
  REPLAY_RESULT = 'replay_result',
  REPLAY_COMPARISON = 'replay_comparison',
  TEST_GENERATED = 'test_generated',

  // Error Tracking (Phase 5)
  ERROR_TRACKED = 'error_tracked',
  ERROR_LIST = 'error_list',
  ERROR_DETAILS = 'error_details',
  ERROR_STATS = 'error_stats',
  ERROR_SPIKE_ALERT = 'error_spike_alert',

  // Errors
  ERROR = 'error',
}

/**
 * Message types sent from client to server
 */
export enum ClientMessageType {
  // Initial connection
  HELLO = 'hello',
  PING = 'ping',

  // Data requests
  GET_METRICS = 'get_metrics',
  GET_ROUTES = 'get_routes',
  GET_REQUESTS = 'get_requests',
  GET_REQUEST = 'get_request',

  // Actions
  CLEAR_REQUESTS = 'clear_requests',
  DELETE_REQUEST = 'delete_request',
  EXPORT_REQUESTS = 'export_requests',

  // Logs
  GET_LOGS = 'get_logs',
  CLEAR_LOGS = 'clear_logs',

  // Performance
  GET_PERFORMANCE = 'get_performance',
  GET_PERFORMANCE_METRICS = 'get_performance_metrics',
  START_PROFILING = 'start_profiling',
  STOP_PROFILING = 'stop_profiling',

  // Replay actions
  REPLAY_REQUEST = 'replay_request',
  COMPARE_RESPONSES = 'compare_responses',
  GENERATE_TEST = 'generate_test',
  EDIT_AND_REPLAY = 'edit_and_replay',

  // Error actions (Phase 5)
  GET_ERRORS = 'get_errors',
  GET_ERROR_DETAILS = 'get_error_details',
  GET_ERROR_STATS = 'get_error_stats',
  MARK_ERROR_RESOLVED = 'mark_error_resolved',
  MARK_ERROR_IGNORED = 'mark_error_ignored',
  CLEAR_ERRORS = 'clear_errors',
  EXPORT_ERRORS = 'export_errors',
}

/**
 * Base message structure
 */
export interface BaseMessage {
  type: string;
  timestamp: number;
  id?: string;
}

/**
 * Server messages
 */
export interface ConnectedMessage extends BaseMessage {
  type: ServerMessageType.CONNECTED;
  data: {
    version: string;
    features: {
      logger: boolean;
      recorder: boolean;
      profiler: boolean;
      devtools: boolean;
    };
  };
}

export interface MetricsUpdateMessage extends BaseMessage {
  type: ServerMessageType.METRICS_UPDATE;
  data: {
    requests: number;
    errors: number;
    avgResponseTime: number;
    memory: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    uptime: number;
  };
}

export interface RoutesListMessage extends BaseMessage {
  type: ServerMessageType.ROUTES_LIST;
  data: {
    routes: Array<{
      method: string;
      path: string;
      handlers: number;
    }>;
  };
}

export interface RequestRecordedMessage extends BaseMessage {
  type: ServerMessageType.REQUEST_RECORDED;
  data: {
    id: string;
    method: string;
    url: string;
    timestamp: number;
  };
}

export interface RequestResponseMessage extends BaseMessage {
  type: ServerMessageType.REQUEST_RESPONSE;
  data: {
    id: string;
    statusCode: number;
    duration: number;
  };
}

export interface RequestsListMessage extends BaseMessage {
  type: ServerMessageType.REQUESTS_LIST;
  data: {
    total: number;
    requests: Array<{
      id: string;
      method: string;
      url: string;
      timestamp: number;
      duration?: number;
      statusCode?: number;
    }>;
  };
}

export interface LogEntryMessage extends BaseMessage {
  type: ServerMessageType.LOG_ENTRY;
  data: {
    level: string;
    message: string;
    context?: string;
    metadata?: Record<string, any>;
    timestamp: number;
  };
}

export interface PerformanceUpdateMessage extends BaseMessage {
  type: ServerMessageType.PERFORMANCE_UPDATE;
  data: {
    cpu: number;
    memory: number;
    eventLoop: number;
    timestamp: number;
  };
}

export interface ReplayResultMessage extends BaseMessage {
  type: ServerMessageType.REPLAY_RESULT;
  data: {
    success: boolean;
    originalId: string;
    replayId: string;
    response?: {
      statusCode: number;
      body: any;
      headers: Record<string, string>;
      duration: number;
    };
    error?: string;
  };
}

export interface ReplayComparisonMessage extends BaseMessage {
  type: ServerMessageType.REPLAY_COMPARISON;
  data: {
    originalId: string;
    replayId: string;
    differences: Array<{
      path: string;
      originalValue: any;
      replayValue: any;
      type: 'added' | 'removed' | 'changed';
    }>;
    summary: {
      identical: boolean;
      statusCodeMatch: boolean;
      bodyMatch: boolean;
      headersMatch: boolean;
    };
  };
}

export interface TestGeneratedMessage extends BaseMessage {
  type: ServerMessageType.TEST_GENERATED;
  data: {
    requestId: string;
    framework: string;
    content: string;
    filename: string;
    testCount: number;
    dependencies?: string[];
  };
}

// Phase 5: Error Tracking Messages
export interface ErrorTrackedMessage extends BaseMessage {
  type: ServerMessageType.ERROR_TRACKED;
  data: {
    hash: string;
    name: string;
    message: string;
    count: number;
    timestamp: number;
  };
}

export interface ErrorListMessage extends BaseMessage {
  type: ServerMessageType.ERROR_LIST;
  data: {
    errors: Array<{
      hash: string;
      message: string;
      type: string;
      count: number;
      firstSeen: number;
      lastSeen: number;
      status: 'active' | 'resolved' | 'ignored';
      severity: 'critical' | 'warning' | 'info';
      trend: 'increasing' | 'stable' | 'decreasing';
    }>;
    total: number;
  };
}

export interface ErrorDetailsMessage extends BaseMessage {
  type: ServerMessageType.ERROR_DETAILS;
  data: {
    hash: string;
    message: string;
    stack: string;
    type: string;
    count: number;
    firstSeen: number;
    lastSeen: number;
    status: 'active' | 'resolved' | 'ignored';
    severity: 'critical' | 'warning' | 'info';
    trend: 'increasing' | 'stable' | 'decreasing';
    routes: Record<string, number>;
    occurrences: Array<{
      timestamp: number;
      requestId: string;
      route: string;
      method: string;
    }>;
  };
}

export interface ErrorStatsMessage extends BaseMessage {
  type: ServerMessageType.ERROR_STATS;
  data: {
    totalErrors: number;
    uniqueErrors: number;
    errorRate: number;
    criticalErrors: number;
    topErrors: Array<{
      hash: string;
      message: string;
      count: number;
    }>;
  };
}

export interface ErrorSpikeAlertMessage extends BaseMessage {
  type: ServerMessageType.ERROR_SPIKE_ALERT;
  data: {
    hash: string;
    message: string;
    currentRate: number;
    averageRate: number;
    threshold: number;
  };
}

export interface ErrorMessage extends BaseMessage {
  type: ServerMessageType.ERROR;
  data: {
    message: string;
    code?: string;
  };
}

export type ServerMessage =
  | ConnectedMessage
  | MetricsUpdateMessage
  | RoutesListMessage
  | RequestRecordedMessage
  | RequestResponseMessage
  | RequestsListMessage
  | { type: ServerMessageType.REQUEST_DETAILS; timestamp: number; id: string; data: any }
  | { type: ServerMessageType.REQUESTS_EXPORT; timestamp: number; id: string; data: { data: any } }
  | LogEntryMessage
  | PerformanceUpdateMessage
  | ReplayResultMessage
  | ReplayComparisonMessage
  | TestGeneratedMessage
  | ErrorTrackedMessage
  | ErrorListMessage
  | ErrorDetailsMessage
  | ErrorStatsMessage
  | ErrorSpikeAlertMessage
  | ErrorMessage;

/**
 * Client messages
 */
export interface HelloMessage extends BaseMessage {
  type: ClientMessageType.HELLO;
  data?: {
    clientVersion?: string;
  };
}

export interface PingMessage extends BaseMessage {
  type: ClientMessageType.PING;
  data?: {
    timestamp?: number;
  };
}

export interface GetMetricsMessage extends BaseMessage {
  type: ClientMessageType.GET_METRICS;
}

export interface GetRoutesMessage extends BaseMessage {
  type: ClientMessageType.GET_ROUTES;
}

export interface GetRequestsMessage extends BaseMessage {
  type: ClientMessageType.GET_REQUESTS;
  data?: {
    limit?: number;
    offset?: number;
  };
}

export interface GetRequestMessage extends BaseMessage {
  type: ClientMessageType.GET_REQUEST;
  data: {
    id: string;
  };
}

export interface ClearRequestsMessage extends BaseMessage {
  type: ClientMessageType.CLEAR_REQUESTS;
}

export interface DeleteRequestMessage extends BaseMessage {
  type: ClientMessageType.DELETE_REQUEST;
  data: {
    id: string;
  };
}

export interface ExportRequestsMessage extends BaseMessage {
  type: ClientMessageType.EXPORT_REQUESTS;
}

export interface GetLogsMessage extends BaseMessage {
  type: ClientMessageType.GET_LOGS;
  data?: {
    limit?: number;
    level?: string;
  };
}

export interface ClearLogsMessage extends BaseMessage {
  type: ClientMessageType.CLEAR_LOGS;
}

export interface GetPerformanceMessage extends BaseMessage {
  type: ClientMessageType.GET_PERFORMANCE;
}

export interface ReplayRequestMessage extends BaseMessage {
  type: ClientMessageType.REPLAY_REQUEST;
  data: {
    id: string;
    mockMode?: boolean;
  };
}

export interface CompareResponsesMessage extends BaseMessage {
  type: ClientMessageType.COMPARE_RESPONSES;
  data: {
    originalId: string;
    replayId: string;
  };
}

export interface GenerateTestMessage extends BaseMessage {
  type: ClientMessageType.GENERATE_TEST;
  data: {
    id?: string; // Single request ID
    ids?: string[]; // Multiple request IDs for test suite
    framework: 'vitest' | 'jest' | 'postman' | 'har';
    options?: {
      includeAssertions?: boolean;
      includeTimings?: boolean;
      namingPattern?: 'descriptive' | 'sequential' | 'grouped';
      baseUrl?: string;
      timeout?: number;
      skipAuth?: boolean;
      headers?: Record<string, string>;
    };
  };
}

export interface EditAndReplayMessage extends BaseMessage {
  type: ClientMessageType.EDIT_AND_REPLAY;
  data: {
    originalId: string;
    editedRequest: {
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      body?: any;
      query?: Record<string, string>;
    };
    mockMode?: boolean;
  };
}

export interface GetPerformanceMetricsMessage extends BaseMessage {
  type: ClientMessageType.GET_PERFORMANCE_METRICS;
}

export interface StartProfilingMessage extends BaseMessage {
  type: ClientMessageType.START_PROFILING;
  data?: {
    duration?: number;
  };
}

export interface StopProfilingMessage extends BaseMessage {
  type: ClientMessageType.STOP_PROFILING;
}

// Phase 5: Error Tracking Client Messages
export interface GetErrorsMessage extends BaseMessage {
  type: ClientMessageType.GET_ERRORS;
  data?: {
    status?: 'active' | 'resolved' | 'ignored';
    severity?: 'critical' | 'warning' | 'info';
    route?: string;
    search?: string;
    limit?: number;
  };
}

export interface GetErrorDetailsMessage extends BaseMessage {
  type: ClientMessageType.GET_ERROR_DETAILS;
  data: {
    hash: string;
  };
}

export interface GetErrorStatsMessage extends BaseMessage {
  type: ClientMessageType.GET_ERROR_STATS;
}

export interface MarkErrorResolvedMessage extends BaseMessage {
  type: ClientMessageType.MARK_ERROR_RESOLVED;
  data: {
    hash: string;
  };
}

export interface MarkErrorIgnoredMessage extends BaseMessage {
  type: ClientMessageType.MARK_ERROR_IGNORED;
  data: {
    hash: string;
  };
}

export interface ClearErrorsMessage extends BaseMessage {
  type: ClientMessageType.CLEAR_ERRORS;
}

export interface ExportErrorsMessage extends BaseMessage {
  type: ClientMessageType.EXPORT_ERRORS;
  data?: {
    format?: 'json' | 'csv';
  };
}

export type ClientMessage =
  | HelloMessage
  | PingMessage
  | GetMetricsMessage
  | GetRoutesMessage
  | GetRequestsMessage
  | GetRequestMessage
  | ClearRequestsMessage
  | DeleteRequestMessage
  | ExportRequestsMessage
  | GetLogsMessage
  | ClearLogsMessage
  | GetPerformanceMessage
  | GetPerformanceMetricsMessage
  | StartProfilingMessage
  | StopProfilingMessage
  | ReplayRequestMessage
  | CompareResponsesMessage
  | GenerateTestMessage
  | EditAndReplayMessage
  | GetErrorsMessage
  | GetErrorDetailsMessage
  | GetErrorStatsMessage
  | MarkErrorResolvedMessage
  | MarkErrorIgnoredMessage
  | ClearErrorsMessage
  | ExportErrorsMessage;

/**
 * Helper to create server messages
 */
export function createServerMessage<T extends ServerMessage>(
  type: ServerMessageType,
  data: any
): T {
  return {
    type,
    timestamp: Date.now(),
    id: generateMessageId(),
    data,
  } as T;
}

/**
 * Helper to create client messages
 */
export function createClientMessage<T extends ClientMessage>(
  type: ClientMessageType,
  data?: any
): T {
  return {
    type,
    timestamp: Date.now(),
    id: generateMessageId(),
    data,
  } as T;
}

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
