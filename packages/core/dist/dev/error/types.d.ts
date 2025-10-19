/**
 * @fileoverview Type definitions for error handling system
 * @module dev/error/types
 */
/**
 * Configuration options for DevErrorHandler
 */
export interface ErrorHandlerOptions {
    /** Whether error handler is enabled */
    enabled: boolean;
    /** Whether to show detailed error information (false in production) */
    showErrorDetails: boolean;
    /** Preferred code editor for opening files */
    editor: 'vscode' | 'webstorm' | 'sublime';
    /** Whether to automatically open errors in editor */
    openEditorOnError: boolean;
    /** Which solution finders to enable */
    solutionFinders: Array<'pattern' | 'stackoverflow' | 'ai'>;
    /** Theme for error pages */
    theme: 'dark' | 'light' | 'auto';
}
/**
 * Enhanced error with additional context
 */
export interface EnhancedError extends Error {
    /** HTTP status code */
    statusCode?: number;
    /** Route where error occurred */
    route?: string;
    /** HTTP method */
    method?: string;
    /** Timestamp when error occurred */
    timestamp: number;
    /** Request ID for tracking */
    requestId?: string;
    /** Source code context */
    sourceContext?: SourceContext;
    /** Solution suggestions */
    solutions?: Solution[];
    /** Event breadcrumbs leading to error */
    breadcrumbs?: Breadcrumb[];
    /** Aggregation ID (hash) */
    aggregationId?: string;
}
/**
 * Source code context around error
 */
export interface SourceContext {
    /** File path (relative to project root) */
    file: string;
    /** Line number where error occurred */
    line: number;
    /** Column number */
    column: number;
    /** Lines of code with context */
    codeLines: CodeLine[];
    /** Programming language */
    language: string;
}
/**
 * Single line of code with metadata
 */
export interface CodeLine {
    /** Line number */
    number: number;
    /** Code content */
    content: string;
    /** Whether this is the error line */
    isError: boolean;
}
/**
 * Solution suggestion for an error
 */
export interface Solution {
    /** Solution title */
    title: string;
    /** Detailed description */
    description: string;
    /** Recommended solution */
    solution: string;
    /** Code example (optional) */
    code?: string;
    /** Helpful links */
    links: SolutionLink[];
    /** Confidence score (0-1) */
    confidence: number;
}
/**
 * Link to external resource
 */
export interface SolutionLink {
    /** Link title */
    title: string;
    /** URL */
    url: string;
    /** Type of resource */
    type: 'docs' | 'stackoverflow' | 'github' | 'mdn';
}
/**
 * Solution pattern for matching errors
 */
export interface SolutionPattern {
    /** Unique pattern ID */
    id: string;
    /** Regex or string pattern to match */
    pattern: RegExp | string;
    /** Error types this applies to */
    errorType?: string[];
    /** Solution title */
    title: string;
    /** Description */
    description: string;
    /** Solution text */
    solution: string;
    /** Code example */
    codeExample?: string;
    /** Helpful links */
    links?: SolutionLink[];
    /** Confidence score */
    confidence: number;
}
/**
 * Breadcrumb event for error tracking
 */
export interface Breadcrumb {
    /** Breadcrumb type */
    type: 'log' | 'http' | 'db' | 'state';
    /** Event category */
    category: string;
    /** Event message */
    message: string;
    /** Timestamp */
    timestamp: number;
    /** Additional data */
    data?: Record<string, unknown>;
    /** Severity level */
    level?: 'debug' | 'info' | 'warning' | 'error';
}
/**
 * Aggregated error with tracking data
 */
export interface AggregatedError {
    /** Unique hash of error */
    hash: string;
    /** Error message */
    message: string;
    /** Stack trace */
    stack: string;
    /** Error type */
    type: string;
    /** Occurrence count */
    count: number;
    /** First occurrence timestamp */
    firstSeen: number;
    /** Last occurrence timestamp */
    lastSeen: number;
    /** Individual occurrences */
    occurrences: ErrorOccurrence[];
    /** Error status */
    status: 'active' | 'resolved' | 'ignored';
    /** Severity level */
    severity: 'critical' | 'warning' | 'info';
    /** Routes where error occurred */
    routes: Map<string, number>;
    /** Error trend */
    trend: 'increasing' | 'stable' | 'decreasing';
    /** Route of first occurrence (for convenience) */
    route?: string;
    /** HTTP method of first occurrence (for convenience) */
    method?: string;
}
/**
 * Single error occurrence
 */
export interface ErrorOccurrence {
    /** Timestamp */
    timestamp: number;
    /** Request ID */
    requestId: string;
    /** Route */
    route: string;
    /** HTTP method */
    method: string;
    /** Additional context */
    context?: unknown;
}
/**
 * Error statistics
 */
export interface ErrorStats {
    /** Total number of errors */
    totalErrors: number;
    /** Number of unique errors */
    uniqueErrors: number;
    /** Error rate (errors per minute) */
    errorRate: number;
    /** Top errors by frequency */
    topErrors: AggregatedError[];
    /** Number of critical errors */
    criticalErrors: number;
}
/**
 * Error filter criteria
 */
export interface ErrorFilter {
    /** Filter by status */
    status?: 'active' | 'resolved' | 'ignored';
    /** Filter by severity */
    severity?: 'critical' | 'warning' | 'info';
    /** Filter by route */
    route?: string;
    /** Filter by error type */
    type?: string;
    /** Filter from date */
    fromDate?: number;
    /** Filter to date */
    toDate?: number;
    /** Minimum occurrence count */
    minCount?: number;
    /** Search query */
    search?: string;
}
/**
 * Error context for tracking
 */
export interface ErrorContext {
    /** Route */
    route: string;
    /** HTTP method */
    method: string;
    /** Timestamp */
    timestamp: number;
    /** Request ID */
    requestId?: string;
    /** Additional data */
    [key: string]: unknown;
}
/**
 * Storage interface for error persistence
 */
export interface ErrorStorage {
    /** Store an error */
    store(error: AggregatedError): Promise<void>;
    /** Find error by hash */
    find(hash: string): Promise<AggregatedError | null>;
    /** List errors with optional filter */
    list(filter?: ErrorFilter): Promise<AggregatedError[]>;
    /** Update error */
    update(hash: string, updates: Partial<AggregatedError>): Promise<void>;
    /** Delete error */
    delete(hash: string): Promise<void>;
    /** Clear all errors */
    clear(): Promise<void>;
    /** Get count of errors */
    count(): Promise<number>;
}
/**
 * Error notifier interface
 */
export interface ErrorNotifier {
    /** Send notification */
    notify(error: EnhancedError): Promise<void>;
    /** Check if notifier is enabled */
    isEnabled(): boolean;
}
/**
 * Notifier configuration
 */
export interface NotifierConfig {
    /** Sentry configuration */
    sentry?: {
        dsn: string;
    };
    /** Slack configuration */
    slack?: {
        webhookUrl: string;
    };
    /** Email configuration */
    email?: {
        to: string[];
        smtp: {
            host: string;
            port: number;
            auth?: {
                user: string;
                pass: string;
            };
        };
    };
    /** Discord configuration */
    discord?: {
        webhookUrl: string;
    };
}
//# sourceMappingURL=types.d.ts.map