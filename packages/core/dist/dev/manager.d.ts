/**
 * Dev Mode Manager
 *
 * Central orchestrator for all dev mode features
 * Follows Single Responsibility: coordinates dev features without implementing them
 */
import { EventEmitter } from 'node:events';
import { DevLogger } from './logger.js';
import { RequestRecorder } from './recorder-manager.js';
import { DevToolsServer } from './devtools-server.js';
import { PerformanceProfiler } from './profiler.js';
import { MetricsCollector } from './profiler-metrics.js';
import { DevErrorHandler } from './error/error-handler.js';
import { ErrorAggregator } from './error/error-aggregator.js';
import type { DevModeOptions } from './types.js';
import type { Application } from '../application.js';
export interface DevModeMetrics {
    /** Total requests processed */
    totalRequests: number;
    /** Total errors encountered */
    totalErrors: number;
    /** Average response time */
    avgResponseTime: number;
    /** Memory usage */
    memoryUsage: NodeJS.MemoryUsage;
    /** Uptime in milliseconds */
    uptime: number;
}
export declare class DevModeManager extends EventEmitter {
    private logger;
    private recorder?;
    private devtoolsServer?;
    private devtoolsHttpServer?;
    private devtoolsHandler?;
    private profiler?;
    private metricsCollector?;
    private errorHandler?;
    private errorAggregator?;
    private options;
    private startTime;
    private metrics;
    constructor(options?: boolean | DevModeOptions);
    /**
     * Set the application instance (for future use)
     */
    setApplication(_app: Application): void;
    /**
     * Start dev mode features
     */
    start(): Promise<void>;
    /**
     * Stop dev mode features
     */
    stop(): Promise<void>;
    /**
     * Get the dev logger
     */
    getLogger(): DevLogger;
    /**
     * Get the request recorder (if enabled)
     */
    getRecorder(): RequestRecorder | undefined;
    /**
     * Get the performance profiler (if enabled)
     */
    getProfiler(): PerformanceProfiler | undefined;
    /**
     * Get the metrics collector (if enabled)
     */
    getMetricsCollector(): MetricsCollector | undefined;
    /**
     * Get the error handler
     */
    getErrorHandler(): DevErrorHandler | undefined;
    /**
     * Get the error aggregator
     */
    getErrorAggregator(): ErrorAggregator | undefined;
    /**
     * Set server information for replay functionality
     */
    setServerInfo(port: number, host?: string): void;
    /**
     * Get current metrics
     */
    getMetrics(): DevModeMetrics;
    /**
     * Record a request
     */
    recordRequest(route: string, method: string, duration: number, isError?: boolean): void;
    /**
     * Record an error
     */
    recordError(error: Error): void;
    /**
     * Update metrics
     */
    private updateMetrics;
    /**
     * Log with context
     */
    log(level: 'info' | 'warn' | 'error', message: string, meta?: any): void;
    /**
     * Start DevTools server
     */
    private startDevTools;
    /**
     * Stop DevTools server
     */
    stopDevTools(): Promise<void>;
    /**
     * Get DevTools server instance
     */
    getDevToolsServer(): DevToolsServer | undefined;
    /**
     * Create request recording middleware
     * This middleware automatically records all incoming requests
     *
     * @deprecated This middleware is no longer needed as recording is now handled
     * automatically in the application's request handler. Using this middleware
     * will cause duplicate response interception and double execution.
     *
     * The recording is now integrated directly into Application.handleRequest()
     * for better performance and to avoid conflicts.
     */
    createRecordingMiddleware(): (req: any, res: any, next: any) => Promise<void>;
    /**
     * Create error tracking middleware
     * This middleware automatically tracks all errors
     */
    createErrorMiddleware(): (err: any, req: any, res: any, next: any) => Promise<void>;
}
/**
 * Create a dev mode manager instance
 */
export declare function createDevMode(options?: boolean | DevModeOptions): DevModeManager | null;
//# sourceMappingURL=manager.d.ts.map