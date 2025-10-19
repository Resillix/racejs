/**
 * Middleware Timing Tracker
 *
 * Tracks execution time per middleware for pipeline visualization.
 * Follows Decorator Pattern - wrap middleware for timing without changing behavior.
 */
import type { Handler } from '../router.js';
export interface MiddlewareTimingData {
    /** Middleware name or identifier */
    name: string;
    /** Start time relative to request start */
    startTime: number;
    /** End time relative to request start */
    endTime: number;
    /** Duration in milliseconds */
    duration: number;
    /** Whether middleware called next() */
    calledNext: boolean;
    /** Error thrown by middleware (if any) */
    error?: Error;
    /** Middleware index in pipeline */
    index: number;
}
export interface MiddlewarePipelineData {
    /** Request ID for correlation */
    requestId: string;
    /** Route that was matched */
    route: string;
    /** Total pipeline duration */
    totalDuration: number;
    /** Individual middleware timings */
    middlewares: MiddlewareTimingData[];
    /** Pipeline start time */
    startTime: number;
    /** Pipeline end time */
    endTime: number;
    /** Whether pipeline completed successfully */
    success: boolean;
    /** Final error (if any) */
    finalError?: Error;
}
/**
 * Middleware Timeline
 *
 * Collects and manages timing data for middleware execution.
 */
export declare class MiddlewareTimeline {
    private middlewares;
    private startTime;
    private pipelineData;
    constructor(requestId: string, route: string);
    /**
     * Start timing for a middleware
     */
    startMiddleware(name: string, index: number): void;
    /**
     * End timing for the current middleware
     */
    endMiddleware(calledNext: boolean, error?: Error): void;
    /**
     * Complete the pipeline and get final data
     */
    complete(success: boolean, finalError?: Error): MiddlewarePipelineData;
    /**
     * Get current middleware timings (for live monitoring)
     */
    getCurrentTimings(): MiddlewareTimingData[];
}
/**
 * Wrap a middleware function to add timing
 */
export declare function wrapMiddleware(middleware: Handler, name: string, timeline: MiddlewareTimeline, index: number): Handler;
/**
 * Middleware Pipeline Profiler
 *
 * Instruments middleware pipelines to collect timing data.
 */
export declare class MiddlewarePipelineProfiler {
    private timelines;
    private completedPipelines;
    private maxRetainedPipelines;
    /**
     * Start tracking a request pipeline
     */
    startPipeline(requestId: string, route: string): MiddlewareTimeline;
    /**
     * Complete a pipeline and store results
     */
    completePipeline(requestId: string, success: boolean, error?: Error): MiddlewarePipelineData | null;
    /**
     * Get timeline for active request
     */
    getTimeline(requestId: string): MiddlewareTimeline | undefined;
    /**
     * Get completed pipeline data
     */
    getCompletedPipelines(): MiddlewarePipelineData[];
    /**
     * Get pipeline data for specific request
     */
    getPipelineData(requestId: string): MiddlewarePipelineData | undefined;
    /**
     * Get middleware performance statistics
     */
    getMiddlewareStats(): Record<string, {
        name: string;
        totalCalls: number;
        totalDuration: number;
        averageDuration: number;
        minDuration: number;
        maxDuration: number;
        errorCount: number;
    }>;
    /**
     * Find slow middleware (above threshold)
     */
    findSlowMiddleware(thresholdMs?: number): {
        middleware: string;
        route: string;
        duration: number;
        requestId: string;
    }[];
    /**
     * Clear old pipeline data
     */
    cleanup(maxAge?: number): void;
}
/**
 * Get or create the global middleware profiler
 */
export declare function getMiddlewareProfiler(): MiddlewarePipelineProfiler;
/**
 * Reset the global profiler (for testing)
 */
export declare function resetMiddlewareProfiler(): void;
//# sourceMappingURL=profiler-middleware.d.ts.map