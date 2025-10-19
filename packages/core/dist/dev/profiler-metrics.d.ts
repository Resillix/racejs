/**
 * Performance Metrics Collector
 *
 * Collects and analyzes performance metrics using ring buffers for efficiency.
 * Follows Observer Pattern - collect metrics without coupling to components.
 */
import { EventEmitter } from 'node:events';
export interface LatencyMetrics {
    /** Average latency */
    avg: number;
    /** Minimum latency */
    min: number;
    /** Maximum latency */
    max: number;
    /** 50th percentile (median) */
    p50: number;
    /** 90th percentile */
    p90: number;
    /** 95th percentile */
    p95: number;
    /** 99th percentile */
    p99: number;
    /** Total sample count */
    count: number;
    /** Standard deviation */
    stddev: number;
}
export interface ThroughputMetrics {
    /** Requests per second */
    requestsPerSecond: number;
    /** Current active requests */
    activeRequests: number;
    /** Total requests processed */
    totalRequests: number;
    /** Errors per second */
    errorsPerSecond: number;
    /** Total errors */
    totalErrors: number;
    /** Error rate (percentage) */
    errorRate: number;
}
export interface MemoryMetrics {
    /** Heap used in bytes */
    heapUsed: number;
    /** Heap total in bytes */
    heapTotal: number;
    /** External memory in bytes */
    external: number;
    /** RSS memory in bytes */
    rss: number;
    /** Array buffers in bytes */
    arrayBuffers: number;
    /** Heap usage percentage */
    heapUsagePercent: number;
    /** Memory trend (growing/stable/decreasing) */
    trend: 'growing' | 'stable' | 'decreasing';
}
export interface RouteMetrics {
    /** Route pattern */
    route: string;
    /** HTTP method */
    method: string;
    /** Request count */
    count: number;
    /** Latency metrics for this route */
    latency: LatencyMetrics;
    /** Last request timestamp */
    lastRequest: number;
    /** Error count for this route */
    errors: number;
    /** Error rate for this route */
    errorRate: number;
}
export interface HistoricalData {
    /** Timestamp */
    timestamp: number;
    /** Latency metrics snapshot */
    latency: LatencyMetrics;
    /** Throughput metrics snapshot */
    throughput: ThroughputMetrics;
    /** Memory metrics snapshot */
    memory: MemoryMetrics;
}
export interface MetricsEvents {
    'metrics-updated': (data: {
        latency: LatencyMetrics;
        throughput: ThroughputMetrics;
        memory: MemoryMetrics;
        routes: RouteMetrics[];
    }) => void;
    'high-latency': (data: {
        route: string;
        latency: number;
        threshold: number;
    }) => void;
    'high-error-rate': (data: {
        route: string;
        errorRate: number;
        threshold: number;
    }) => void;
    'memory-pressure': (data: {
        usage: number;
        threshold: number;
    }) => void;
}
/**
 * Performance Metrics Collector
 *
 * Efficiently collects and analyzes performance metrics.
 */
export declare class MetricsCollector extends EventEmitter {
    private latencyBuffer;
    private requestTimestamps;
    private errorTimestamps;
    private memoryHistory;
    private historicalData;
    private routeMetrics;
    private activeRequests;
    private totalRequests;
    private totalErrors;
    private highLatencyThreshold;
    private highErrorRateThreshold;
    private memoryPressureThreshold;
    private updateInterval;
    private updateIntervalMs;
    emit: <K extends keyof MetricsEvents>(event: K, ...args: Parameters<MetricsEvents[K]>) => boolean;
    on: <K extends keyof MetricsEvents>(event: K, listener: MetricsEvents[K]) => this;
    constructor();
    /**
     * Start metrics collection
     */
    start(): void;
    /**
     * Stop metrics collection
     */
    stop(): void;
    /**
     * Record a request start
     */
    recordRequestStart(): void;
    /**
     * Record a request completion
     */
    recordRequestEnd(route: string, method: string, latency: number, isError?: boolean): void;
    /**
     * Get current latency metrics
     */
    getLatencyMetrics(): LatencyMetrics;
    /**
     * Get current throughput metrics
     */
    getThroughputMetrics(): ThroughputMetrics;
    /**
     * Get current memory metrics
     */
    getMemoryMetrics(): MemoryMetrics;
    /**
     * Get route-specific metrics
     */
    getRouteMetrics(): RouteMetrics[];
    /**
     * Get historical data
     */
    getHistoricalData(hours?: number): HistoricalData[];
    /**
     * Get metrics summary
     */
    getMetricsSummary(): {
        latency: LatencyMetrics;
        throughput: ThroughputMetrics;
        memory: MemoryMetrics;
        routes: RouteMetrics[];
    };
    /**
     * Get all metrics (alias for getMetricsSummary)
     */
    getMetrics(): {
        latency: LatencyMetrics;
        throughput: ThroughputMetrics;
        memory: MemoryMetrics;
        routes: RouteMetrics[];
        requestCount: number;
        errorCount: number;
        activeRequests: number;
    };
    /**
     * Get latency percentiles
     */
    getLatencyPercentiles(): {
        p50: number;
        p90: number;
        p95: number;
        p99: number;
        avg: number;
        min: number;
        max: number;
    };
    /**
     * Get metrics for a specific route by pattern
     */
    getRouteMetricsByPattern(route: string): RouteMetrics | undefined;
    /**
     * Clear all metrics data
     */
    clear(): void;
    /**
     * Calculate percentile from sorted array
     */
    private calculatePercentile;
    /**
     * Calculate latency metrics for specific data
     */
    private calculateLatencyMetrics;
    /**
     * Calculate memory trend
     */
    private calculateMemoryTrend;
    /**
     * Check for performance alerts
     */
    private checkAlerts;
    /**
     * Update metrics and emit events
     */
    private updateMetrics;
}
/**
 * Get or create the global metrics collector
 */
export declare function getMetricsCollector(): MetricsCollector;
/**
 * Reset the global metrics collector (for testing)
 */
export declare function resetMetricsCollector(): void;
//# sourceMappingURL=profiler-metrics.d.ts.map