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
import { performance } from 'node:perf_hooks';
import { inspect } from 'node:util';
const LOG_LEVELS = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5,
};
const LOG_COLORS = {
    trace: '\x1b[90m', // Gray
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    fatal: '\x1b[35m', // Magenta
    reset: '\x1b[0m',
};
const LOG_EMOJIS = {
    trace: '🔍',
    debug: '🐛',
    info: 'ℹ️ ',
    warn: '⚠️ ',
    error: '❌',
    fatal: '💀',
};
export class DevLogger {
    options;
    startTime = performance.now();
    constructor(options = {}) {
        this.options = {
            level: options.level || 'info',
            pretty: options.pretty !== false,
            colors: options.colors !== false && process.stdout.isTTY,
            transports: options.transports || [new ConsoleTransport()],
            context: options.context || {},
        };
    }
    /**
     * Check if a log level should be output
     */
    shouldLog(level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.options.level];
    }
    /**
     * Create a log entry and send to transports
     */
    log(level, message, meta, context) {
        if (!this.shouldLog(level))
            return;
        const entry = {
            level,
            message,
            timestamp: Date.now(),
            context: { ...this.options.context, ...context },
            meta,
        };
        for (const transport of this.options.transports) {
            transport.log(entry);
        }
    }
    /**
     * Format duration in human-readable format
     */
    formatDuration(ms) {
        if (ms < 1)
            return `${(ms * 1000).toFixed(0)}µs`;
        if (ms < 1000)
            return `${ms.toFixed(2)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    }
    /**
     * Get elapsed time since logger creation
     */
    getUptime() {
        return performance.now() - this.startTime;
    }
    // Public logging methods
    trace(message, meta, context) {
        this.log('trace', message, meta, context);
    }
    debug(message, meta, context) {
        this.log('debug', message, meta, context);
    }
    info(message, meta, context) {
        this.log('info', message, meta, context);
    }
    warn(message, meta, context) {
        this.log('warn', message, meta, context);
    }
    error(message, meta, context) {
        this.log('error', message, meta, context);
    }
    fatal(message, meta, context) {
        this.log('fatal', message, meta, context);
    }
    /**
     * Create a child logger with additional context
     */
    child(context) {
        return new DevLogger({
            ...this.options,
            context: { ...this.options.context, ...context },
        });
    }
    /**
     * Measure execution time of a function
     */
    async time(label, fn) {
        const start = performance.now();
        this.debug(`${label} started`);
        try {
            const result = await fn();
            const duration = performance.now() - start;
            this.debug(`${label} completed`, { duration: this.formatDuration(duration) });
            return result;
        }
        catch (error) {
            const duration = performance.now() - start;
            this.error(`${label} failed`, { duration: this.formatDuration(duration), error });
            throw error;
        }
    }
    /**
     * Add a new transport
     */
    addTransport(transport) {
        this.options.transports.push(transport);
    }
    /**
     * Get all configured transports
     */
    getTransports() {
        return this.options.transports;
    }
    /**
     * Remove a transport
     */
    removeTransport(transport) {
        const index = this.options.transports.indexOf(transport);
        if (index > -1) {
            this.options.transports.splice(index, 1);
        }
    }
}
/**
 * Default console transport with pretty formatting
 */
export class ConsoleTransport {
    log(entry) {
        const { level, message, timestamp, context, meta } = entry;
        const colors = process.stdout.isTTY;
        // Format timestamp
        const date = new Date(timestamp);
        const time = date.toISOString().split('T')[1]?.split('.')[0] || '00:00:00';
        // Build log line
        const emoji = LOG_EMOJIS[level];
        const color = colors ? LOG_COLORS[level] : '';
        const reset = colors ? LOG_COLORS.reset : '';
        const levelStr = level.toUpperCase().padEnd(5);
        // Format context
        const contextParts = [];
        if (context.requestId)
            contextParts.push(`req:${context.requestId.slice(0, 8)}`);
        if (context.method && context.route)
            contextParts.push(`${context.method} ${context.route}`);
        const contextStr = contextParts.length > 0 ? ` [${contextParts.join(' ')}]` : '';
        // Main log line
        console.log(`${color}${emoji}  ${time} ${levelStr}${reset} ${message}${contextStr}`);
        // Additional metadata
        if (meta !== undefined) {
            const metaStr = typeof meta === 'object'
                ? inspect(meta, { colors, depth: 3, compact: false })
                : String(meta);
            console.log(`   ${metaStr}`);
        }
    }
}
/**
 * JSON transport for structured logging
 */
export class JsonTransport {
    log(entry) {
        console.log(JSON.stringify(entry));
    }
}
/**
 * Create a default dev logger instance
 */
export function createDevLogger(options) {
    return new DevLogger(options);
}
//# sourceMappingURL=logger.js.map