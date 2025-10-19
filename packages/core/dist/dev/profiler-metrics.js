/**
 * Performance Metrics Collector
 *
 * Collects and analyzes performance metrics using ring buffers for efficiency.
 * Follows Observer Pattern - collect metrics without coupling to components.
 */
import { EventEmitter } from 'node:events';
/**
 * Ring Buffer for efficient metrics storage
 */
class RingBuffer {
    buffer;
    size;
    index = 0;
    count = 0;
    constructor(size) {
        this.size = size;
        this.buffer = new Array(size);
    }
    add(item) {
        this.buffer[this.index] = item;
        this.index = (this.index + 1) % this.size;
        this.count = Math.min(this.count + 1, this.size);
    }
    getAll() {
        if (this.count < this.size) {
            return this.buffer.slice(0, this.count);
        }
        // Return items in chronological order
        return [...this.buffer.slice(this.index), ...this.buffer.slice(0, this.index)];
    }
    getRecent(n) {
        const all = this.getAll();
        return all.slice(-n);
    }
    getSize() {
        return this.count;
    }
    clear() {
        this.index = 0;
        this.count = 0;
    }
}
/**
 * Performance Metrics Collector
 *
 * Efficiently collects and analyzes performance metrics.
 */
export class MetricsCollector extends EventEmitter {
    latencyBuffer = new RingBuffer(1000);
    requestTimestamps = new RingBuffer(1000);
    errorTimestamps = new RingBuffer(1000);
    memoryHistory = new RingBuffer(100);
    historicalData = new RingBuffer(288); // 24 hours at 5-min intervals
    routeMetrics = new Map();
    activeRequests = 0;
    totalRequests = 0;
    totalErrors = 0;
    // Alert thresholds
    highLatencyThreshold = 1000; // 1 second
    highErrorRateThreshold = 5; // 5%
    memoryPressureThreshold = 85; // 85% heap usage
    // Update interval
    updateInterval = null;
    updateIntervalMs = 5000; // 5 seconds
    constructor() {
        super();
    }
    /**
     * Start metrics collection
     */
    start() {
        if (this.updateInterval)
            return;
        // Collect memory baseline
        this.memoryHistory.add(process.memoryUsage());
        // Start periodic updates
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
        }, this.updateIntervalMs);
    }
    /**
     * Stop metrics collection
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    /**
     * Record a request start
     */
    recordRequestStart() {
        this.activeRequests++;
        this.totalRequests++;
    }
    /**
     * Record a request completion
     */
    recordRequestEnd(route, method, latency, isError = false) {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        // Record latency
        this.latencyBuffer.add(latency);
        this.requestTimestamps.add(Date.now());
        // Record error if applicable
        if (isError) {
            this.totalErrors++;
            this.errorTimestamps.add(Date.now());
        }
        // Update route metrics
        const routeKey = `${method} ${route}`;
        let routeData = this.routeMetrics.get(routeKey);
        if (!routeData) {
            routeData = {
                count: 0,
                latencies: [],
                errors: 0,
                lastRequest: 0,
            };
            this.routeMetrics.set(routeKey, routeData);
        }
        routeData.count++;
        routeData.latencies.push(latency);
        routeData.lastRequest = Date.now();
        if (isError) {
            routeData.errors++;
        }
        // Keep only recent latencies (last 100)
        if (routeData.latencies.length > 100) {
            routeData.latencies = routeData.latencies.slice(-100);
        }
        // Check for alerts
        this.checkAlerts(routeKey, route, latency, isError);
    }
    /**
     * Get current latency metrics
     */
    getLatencyMetrics() {
        const latencies = this.latencyBuffer.getAll();
        if (latencies.length === 0) {
            return {
                avg: 0,
                min: 0,
                max: 0,
                p50: 0,
                p90: 0,
                p95: 0,
                p99: 0,
                count: 0,
                stddev: 0,
            };
        }
        const sorted = latencies.slice().sort((a, b) => a - b);
        const sum = latencies.reduce((a, b) => a + b, 0);
        const avg = sum / latencies.length;
        // Calculate standard deviation
        const variance = latencies.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / latencies.length;
        const stddev = Math.sqrt(variance);
        return {
            avg,
            min: sorted[0] ?? 0,
            max: sorted[sorted.length - 1] ?? 0,
            p50: this.calculatePercentile(sorted, 50),
            p90: this.calculatePercentile(sorted, 90),
            p95: this.calculatePercentile(sorted, 95),
            p99: this.calculatePercentile(sorted, 99),
            count: latencies.length,
            stddev,
        };
    }
    /**
     * Get current throughput metrics
     */
    getThroughputMetrics() {
        const now = Date.now();
        const oneSecondAgo = now - 1000;
        // Count requests in last second
        const recentRequests = this.requestTimestamps.getAll().filter((ts) => ts > oneSecondAgo);
        const recentErrors = this.errorTimestamps.getAll().filter((ts) => ts > oneSecondAgo);
        const requestsPerSecond = recentRequests.length;
        const errorsPerSecond = recentErrors.length;
        const errorRate = this.totalRequests > 0 ? (this.totalErrors / this.totalRequests) * 100 : 0;
        return {
            requestsPerSecond,
            activeRequests: this.activeRequests,
            totalRequests: this.totalRequests,
            errorsPerSecond,
            totalErrors: this.totalErrors,
            errorRate,
        };
    }
    /**
     * Get current memory metrics
     */
    getMemoryMetrics() {
        const current = process.memoryUsage();
        this.memoryHistory.add(current);
        const heapUsagePercent = (current.heapUsed / current.heapTotal) * 100;
        const trend = this.calculateMemoryTrend();
        return {
            heapUsed: current.heapUsed,
            heapTotal: current.heapTotal,
            external: current.external,
            rss: current.rss,
            arrayBuffers: current.arrayBuffers || 0,
            heapUsagePercent,
            trend,
        };
    }
    /**
     * Get route-specific metrics
     */
    getRouteMetrics() {
        const routes = [];
        for (const [routeKey, data] of this.routeMetrics) {
            const [method, route] = routeKey.split(' ', 2);
            const latency = this.calculateLatencyMetrics(data.latencies);
            const errorRate = data.count > 0 ? (data.errors / data.count) * 100 : 0;
            routes.push({
                route: route ?? '',
                method: method ?? 'GET',
                count: data.count,
                latency,
                lastRequest: data.lastRequest,
                errors: data.errors,
                errorRate,
            });
        }
        return routes.sort((a, b) => b.count - a.count);
    }
    /**
     * Get historical data
     */
    getHistoricalData(hours = 24) {
        const cutoff = Date.now() - hours * 60 * 60 * 1000;
        return this.historicalData.getAll().filter((data) => data.timestamp > cutoff);
    }
    /**
     * Get metrics summary
     */
    getMetricsSummary() {
        return {
            latency: this.getLatencyMetrics(),
            throughput: this.getThroughputMetrics(),
            memory: this.getMemoryMetrics(),
            routes: this.getRouteMetrics(),
        };
    }
    /**
     * Get all metrics (alias for getMetricsSummary)
     */
    getMetrics() {
        const summary = this.getMetricsSummary();
        return {
            ...summary,
            requestCount: this.totalRequests,
            errorCount: this.totalErrors,
            activeRequests: this.activeRequests,
        };
    }
    /**
     * Get latency percentiles
     */
    getLatencyPercentiles() {
        const latency = this.getLatencyMetrics();
        return {
            p50: latency.p50,
            p90: latency.p90,
            p95: latency.p95,
            p99: latency.p99,
            avg: latency.avg,
            min: latency.min,
            max: latency.max,
        };
    }
    /**
     * Get metrics for a specific route by pattern
     */
    getRouteMetricsByPattern(route) {
        const allRoutes = this.getRouteMetrics();
        return allRoutes.find((r) => r.route === route);
    }
    /**
     * Clear all metrics data
     */
    clear() {
        this.latencyBuffer.clear();
        this.requestTimestamps.clear();
        this.errorTimestamps.clear();
        this.memoryHistory.clear();
        this.historicalData.clear();
        this.routeMetrics.clear();
        this.activeRequests = 0;
        this.totalRequests = 0;
        this.totalErrors = 0;
    }
    /**
     * Calculate percentile from sorted array
     */
    calculatePercentile(sorted, percentile) {
        if (sorted.length === 0)
            return 0;
        const index = (percentile / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) {
            return sorted[lower] ?? 0;
        }
        const weight = index - lower;
        return (sorted[lower] ?? 0) * (1 - weight) + (sorted[upper] ?? 0) * weight;
    }
    /**
     * Calculate latency metrics for specific data
     */
    calculateLatencyMetrics(latencies) {
        if (latencies.length === 0) {
            return {
                avg: 0,
                min: 0,
                max: 0,
                p50: 0,
                p90: 0,
                p95: 0,
                p99: 0,
                count: 0,
                stddev: 0,
            };
        }
        const sorted = latencies.slice().sort((a, b) => a - b);
        const sum = latencies.reduce((a, b) => a + b, 0);
        const avg = sum / latencies.length;
        const variance = latencies.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / latencies.length;
        return {
            avg,
            min: sorted[0] ?? 0,
            max: sorted[sorted.length - 1] ?? 0,
            p50: this.calculatePercentile(sorted, 50),
            p90: this.calculatePercentile(sorted, 90),
            p95: this.calculatePercentile(sorted, 95),
            p99: this.calculatePercentile(sorted, 99),
            count: latencies.length,
            stddev: Math.sqrt(variance),
        };
    }
    /**
     * Calculate memory trend
     */
    calculateMemoryTrend() {
        const history = this.memoryHistory.getAll();
        if (history.length < 2)
            return 'stable';
        const recent = history.slice(-10); // Last 10 samples
        if (recent.length < 2)
            return 'stable';
        const first = recent[0]?.heapUsed ?? 0;
        const last = recent[recent.length - 1]?.heapUsed ?? 0;
        const change = last - first;
        const changePercent = (change / first) * 100;
        if (changePercent > 5)
            return 'growing';
        if (changePercent < -5)
            return 'decreasing';
        return 'stable';
    }
    /**
     * Check for performance alerts
     */
    checkAlerts(routeKey, route, latency, _isError) {
        // High latency alert
        if (latency > this.highLatencyThreshold) {
            this.emit('high-latency', {
                route,
                latency,
                threshold: this.highLatencyThreshold,
            });
        }
        // High error rate alert
        const routeData = this.routeMetrics.get(routeKey);
        if (routeData && routeData.count >= 10) {
            // Only check after some requests
            const errorRate = (routeData.errors / routeData.count) * 100;
            if (errorRate > this.highErrorRateThreshold) {
                this.emit('high-error-rate', {
                    route,
                    errorRate,
                    threshold: this.highErrorRateThreshold,
                });
            }
        }
        // Memory pressure alert
        const memoryMetrics = this.getMemoryMetrics();
        if (memoryMetrics.heapUsagePercent > this.memoryPressureThreshold) {
            this.emit('memory-pressure', {
                usage: memoryMetrics.heapUsagePercent,
                threshold: this.memoryPressureThreshold,
            });
        }
    }
    /**
     * Update metrics and emit events
     */
    updateMetrics() {
        const summary = this.getMetricsSummary();
        // Store historical data
        this.historicalData.add({
            timestamp: Date.now(),
            latency: summary.latency,
            throughput: summary.throughput,
            memory: summary.memory,
        });
        // Emit metrics update
        this.emit('metrics-updated', summary);
    }
}
/**
 * Global metrics collector instance
 */
let globalCollector = null;
/**
 * Get or create the global metrics collector
 */
export function getMetricsCollector() {
    if (!globalCollector) {
        globalCollector = new MetricsCollector();
    }
    return globalCollector;
}
/**
 * Reset the global metrics collector (for testing)
 */
export function resetMetricsCollector() {
    if (globalCollector) {
        globalCollector.stop();
    }
    globalCollector = null;
}
//# sourceMappingURL=profiler-metrics.js.map