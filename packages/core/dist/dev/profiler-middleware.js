/**
 * Middleware Timing Tracker
 *
 * Tracks execution time per middleware for pipeline visualization.
 * Follows Decorator Pattern - wrap middleware for timing without changing behavior.
 */
import { performance } from 'node:perf_hooks';
/**
 * Middleware Timeline
 *
 * Collects and manages timing data for middleware execution.
 */
export class MiddlewareTimeline {
    middlewares = [];
    startTime;
    pipelineData;
    constructor(requestId, route) {
        this.startTime = performance.now();
        this.pipelineData = {
            requestId,
            route,
            startTime: this.startTime,
            middlewares: this.middlewares,
            success: false,
        };
    }
    /**
     * Start timing for a middleware
     */
    startMiddleware(name, index) {
        const timing = {
            name,
            startTime: performance.now() - this.startTime,
            endTime: 0,
            duration: 0,
            calledNext: false,
            index,
        };
        this.middlewares.push(timing);
    }
    /**
     * End timing for the current middleware
     */
    endMiddleware(calledNext, error) {
        const currentMiddleware = this.middlewares[this.middlewares.length - 1];
        if (!currentMiddleware)
            return;
        const endTime = performance.now() - this.startTime;
        currentMiddleware.endTime = endTime;
        currentMiddleware.duration = endTime - currentMiddleware.startTime;
        currentMiddleware.calledNext = calledNext;
        if (error) {
            currentMiddleware.error = error;
        }
    }
    /**
     * Complete the pipeline and get final data
     */
    complete(success, finalError) {
        const endTime = performance.now();
        const data = {
            requestId: this.pipelineData.requestId,
            route: this.pipelineData.route,
            totalDuration: endTime - this.startTime,
            middlewares: this.middlewares,
            startTime: this.startTime,
            endTime,
            success,
        };
        // Only add finalError if it exists
        if (finalError) {
            data.finalError = finalError;
        }
        return data;
    }
    /**
     * Get current middleware timings (for live monitoring)
     */
    getCurrentTimings() {
        return [...this.middlewares];
    }
}
/**
 * Wrap a middleware function to add timing
 */
export function wrapMiddleware(middleware, name, timeline, index) {
    // Return a handler that matches the Handler type signature
    return (req, res, next) => {
        timeline.startMiddleware(name, index);
        let calledNext = false;
        let middlewareError;
        // Wrap next() to track if it was called
        const wrappedNext = (error) => {
            calledNext = true;
            if (error) {
                middlewareError = error instanceof Error ? error : new Error(String(error));
            }
            timeline.endMiddleware(calledNext, middlewareError);
            next(error);
        };
        const executeMiddleware = async () => {
            try {
                // Execute middleware
                const result = middleware(req, res, wrappedNext);
                // Handle async middleware
                if (result instanceof Promise) {
                    await result;
                }
                // If next() wasn't called and no error, middleware completed normally
                if (!calledNext) {
                    timeline.endMiddleware(false);
                }
            }
            catch (error) {
                middlewareError = error instanceof Error ? error : new Error(String(error));
                timeline.endMiddleware(calledNext, middlewareError);
                next(middlewareError);
            }
        };
        // Execute without blocking
        executeMiddleware().catch((error) => {
            const err = error instanceof Error ? error : new Error(String(error));
            timeline.endMiddleware(false, err);
            next(err);
        });
    };
}
/**
 * Middleware Pipeline Profiler
 *
 * Instruments middleware pipelines to collect timing data.
 */
export class MiddlewarePipelineProfiler {
    timelines = new Map();
    completedPipelines = [];
    maxRetainedPipelines = 100;
    /**
     * Start tracking a request pipeline
     */
    startPipeline(requestId, route) {
        const timeline = new MiddlewareTimeline(requestId, route);
        this.timelines.set(requestId, timeline);
        return timeline;
    }
    /**
     * Complete a pipeline and store results
     */
    completePipeline(requestId, success, error) {
        const timeline = this.timelines.get(requestId);
        if (!timeline)
            return null;
        const pipelineData = timeline.complete(success, error);
        this.timelines.delete(requestId);
        // Store completed pipeline
        this.completedPipelines.push(pipelineData);
        // Keep only recent pipelines
        if (this.completedPipelines.length > this.maxRetainedPipelines) {
            this.completedPipelines = this.completedPipelines.slice(-this.maxRetainedPipelines);
        }
        return pipelineData;
    }
    /**
     * Get timeline for active request
     */
    getTimeline(requestId) {
        return this.timelines.get(requestId);
    }
    /**
     * Get completed pipeline data
     */
    getCompletedPipelines() {
        return [...this.completedPipelines];
    }
    /**
     * Get pipeline data for specific request
     */
    getPipelineData(requestId) {
        return this.completedPipelines.find((p) => p.requestId === requestId);
    }
    /**
     * Get middleware performance statistics
     */
    getMiddlewareStats() {
        const stats = {};
        for (const pipeline of this.completedPipelines) {
            for (const middleware of pipeline.middlewares) {
                if (!stats[middleware.name]) {
                    stats[middleware.name] = {
                        name: middleware.name,
                        totalCalls: 0,
                        totalDuration: 0,
                        averageDuration: 0,
                        minDuration: Infinity,
                        maxDuration: 0,
                        errorCount: 0,
                    };
                }
                const stat = stats[middleware.name];
                stat.totalCalls++;
                stat.totalDuration += middleware.duration;
                stat.minDuration = Math.min(stat.minDuration, middleware.duration);
                stat.maxDuration = Math.max(stat.maxDuration, middleware.duration);
                if (middleware.error) {
                    stat.errorCount++;
                }
            }
        }
        // Calculate averages
        for (const stat of Object.values(stats)) {
            stat.averageDuration = stat.totalDuration / stat.totalCalls;
            if (stat.minDuration === Infinity) {
                stat.minDuration = 0;
            }
        }
        return stats;
    }
    /**
     * Find slow middleware (above threshold)
     */
    findSlowMiddleware(thresholdMs = 100) {
        const slowMiddleware = [];
        for (const pipeline of this.completedPipelines) {
            for (const middleware of pipeline.middlewares) {
                if (middleware.duration > thresholdMs) {
                    slowMiddleware.push({
                        middleware: middleware.name,
                        route: pipeline.route,
                        duration: middleware.duration,
                        requestId: pipeline.requestId,
                    });
                }
            }
        }
        return slowMiddleware.sort((a, b) => b.duration - a.duration);
    }
    /**
     * Clear old pipeline data
     */
    cleanup(maxAge = 10 * 60 * 1000) {
        const cutoff = Date.now() - maxAge;
        this.completedPipelines = this.completedPipelines.filter((pipeline) => pipeline.startTime > cutoff);
    }
}
/**
 * Global middleware pipeline profiler instance
 */
let globalProfiler = null;
/**
 * Get or create the global middleware profiler
 */
export function getMiddlewareProfiler() {
    if (!globalProfiler) {
        globalProfiler = new MiddlewarePipelineProfiler();
    }
    return globalProfiler;
}
/**
 * Reset the global profiler (for testing)
 */
export function resetMiddlewareProfiler() {
    globalProfiler = null;
}
//# sourceMappingURL=profiler-middleware.js.map