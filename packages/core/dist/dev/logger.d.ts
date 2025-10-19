/**
 * Structured Dev Logger for RaceJS
 *
 * Provides:
 * - Multiple log levels (trace, debug, info, warn, error, fatal)
 * - Automatic context injection (timestamp, requestId, etc.)
 * - Color-coded output with emojis
 * - Performance timing with high precision
 * - Multiple transports (console, file, custom)
 * - JSON and pretty output formats
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export interface LogContext {
    /** Request ID for tracing */
    requestId?: string;
    /** User ID if authenticated */
    userId?: string;
    /** Route being processed */
    route?: string;
    /** HTTP method */
    method?: string;
    /** Additional metadata */
    [key: string]: any;
}
export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: number;
    context: LogContext;
    meta?: any;
}
export interface LogTransport {
    log(entry: LogEntry): void;
}
export interface DevLoggerOptions {
    /** Minimum log level to output */
    level?: LogLevel;
    /** Enable pretty formatting */
    pretty?: boolean;
    /** Enable colors in output */
    colors?: boolean;
    /** Custom transports */
    transports?: LogTransport[];
    /** Global context to include in all logs */
    context?: LogContext;
}
export declare class DevLogger {
    private options;
    private startTime;
    constructor(options?: DevLoggerOptions);
    /**
     * Check if a log level should be output
     */
    private shouldLog;
    /**
     * Create a log entry and send to transports
     */
    private log;
    /**
     * Format duration in human-readable format
     */
    private formatDuration;
    /**
     * Get elapsed time since logger creation
     */
    getUptime(): number;
    trace(message: string, meta?: any, context?: LogContext): void;
    debug(message: string, meta?: any, context?: LogContext): void;
    info(message: string, meta?: any, context?: LogContext): void;
    warn(message: string, meta?: any, context?: LogContext): void;
    error(message: string, meta?: any, context?: LogContext): void;
    fatal(message: string, meta?: any, context?: LogContext): void;
    /**
     * Create a child logger with additional context
     */
    child(context: LogContext): DevLogger;
    /**
     * Measure execution time of a function
     */
    time<T>(label: string, fn: () => Promise<T> | T): Promise<T>;
    /**
     * Add a new transport
     */
    addTransport(transport: LogTransport): void;
    /**
     * Get all configured transports
     */
    getTransports(): LogTransport[];
    /**
     * Remove a transport
     */
    removeTransport(transport: LogTransport): void;
}
/**
 * Default console transport with pretty formatting
 */
export declare class ConsoleTransport implements LogTransport {
    log(entry: LogEntry): void;
}
/**
 * JSON transport for structured logging
 */
export declare class JsonTransport implements LogTransport {
    log(entry: LogEntry): void;
}
/**
 * Create a default dev logger instance
 */
export declare function createDevLogger(options?: DevLoggerOptions): DevLogger;
//# sourceMappingURL=logger.d.ts.map