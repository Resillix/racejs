/**
 * Middleware Timing Tracker
 *
 * Tracks execution time per middleware for pipeline visualization.
 * Follows Decorator Pattern - wrap middleware for timing without changing behavior.
 */

import { performance } from 'node:perf_hooks';
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
export class MiddlewareTimeline {
  private middlewares: MiddlewareTimingData[] = [];
  private startTime: number;
  private pipelineData: Partial<MiddlewarePipelineData>;

  constructor(requestId: string, route: string) {
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
  startMiddleware(name: string, index: number): void {
    const timing: MiddlewareTimingData = {
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
  endMiddleware(calledNext: boolean, error?: Error): void {
    const currentMiddleware = this.middlewares[this.middlewares.length - 1];
    if (!currentMiddleware) return;

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
  complete(success: boolean, finalError?: Error): MiddlewarePipelineData {
    const endTime = performance.now();

    const data: MiddlewarePipelineData = {
      requestId: this.pipelineData.requestId!,
      route: this.pipelineData.route!,
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
  getCurrentTimings(): MiddlewareTimingData[] {
    return [...this.middlewares];
  }
}

/**
 * Wrap a middleware function to add timing
 */
export function wrapMiddleware(
  middleware: Handler,
  name: string,
  timeline: MiddlewareTimeline,
  index: number
): Handler {
  // Return a handler that matches the Handler type signature
  return (req, res, next) => {
    timeline.startMiddleware(name, index);

    let calledNext = false;
    let middlewareError: Error | undefined;

    // Wrap next() to track if it was called
    const wrappedNext = (error?: any) => {
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
      } catch (error) {
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
  private timelines: Map<string, MiddlewareTimeline> = new Map();
  private completedPipelines: MiddlewarePipelineData[] = [];
  private maxRetainedPipelines = 100;

  /**
   * Start tracking a request pipeline
   */
  startPipeline(requestId: string, route: string): MiddlewareTimeline {
    const timeline = new MiddlewareTimeline(requestId, route);
    this.timelines.set(requestId, timeline);
    return timeline;
  }

  /**
   * Complete a pipeline and store results
   */
  completePipeline(
    requestId: string,
    success: boolean,
    error?: Error
  ): MiddlewarePipelineData | null {
    const timeline = this.timelines.get(requestId);
    if (!timeline) return null;

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
  getTimeline(requestId: string): MiddlewareTimeline | undefined {
    return this.timelines.get(requestId);
  }

  /**
   * Get completed pipeline data
   */
  getCompletedPipelines(): MiddlewarePipelineData[] {
    return [...this.completedPipelines];
  }

  /**
   * Get pipeline data for specific request
   */
  getPipelineData(requestId: string): MiddlewarePipelineData | undefined {
    return this.completedPipelines.find((p) => p.requestId === requestId);
  }

  /**
   * Get middleware performance statistics
   */
  getMiddlewareStats(): Record<
    string,
    {
      name: string;
      totalCalls: number;
      totalDuration: number;
      averageDuration: number;
      minDuration: number;
      maxDuration: number;
      errorCount: number;
    }
  > {
    const stats: Record<string, any> = {};

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
  findSlowMiddleware(thresholdMs: number = 100): {
    middleware: string;
    route: string;
    duration: number;
    requestId: string;
  }[] {
    const slowMiddleware: any[] = [];

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
  cleanup(maxAge: number = 10 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;

    this.completedPipelines = this.completedPipelines.filter(
      (pipeline) => pipeline.startTime > cutoff
    );
  }
}

/**
 * Global middleware pipeline profiler instance
 */
let globalProfiler: MiddlewarePipelineProfiler | null = null;

/**
 * Get or create the global middleware profiler
 */
export function getMiddlewareProfiler(): MiddlewarePipelineProfiler {
  if (!globalProfiler) {
    globalProfiler = new MiddlewarePipelineProfiler();
  }
  return globalProfiler;
}

/**
 * Reset the global profiler (for testing)
 */
export function resetMiddlewareProfiler(): void {
  globalProfiler = null;
}
