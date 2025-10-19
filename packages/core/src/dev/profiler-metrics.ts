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
  'high-latency': (data: { route: string; latency: number; threshold: number }) => void;
  'high-error-rate': (data: { route: string; errorRate: number; threshold: number }) => void;
  'memory-pressure': (data: { usage: number; threshold: number }) => void;
}

/**
 * Ring Buffer for efficient metrics storage
 */
class RingBuffer<T> {
  private buffer: T[];
  private size: number;
  private index: number = 0;
  private count: number = 0;

  constructor(size: number) {
    this.size = size;
    this.buffer = new Array(size);
  }

  add(item: T): void {
    this.buffer[this.index] = item;
    this.index = (this.index + 1) % this.size;
    this.count = Math.min(this.count + 1, this.size);
  }

  getAll(): T[] {
    if (this.count < this.size) {
      return this.buffer.slice(0, this.count);
    }

    // Return items in chronological order
    return [...this.buffer.slice(this.index), ...this.buffer.slice(0, this.index)];
  }

  getRecent(n: number): T[] {
    const all = this.getAll();
    return all.slice(-n);
  }

  getSize(): number {
    return this.count;
  }

  clear(): void {
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
  private latencyBuffer = new RingBuffer<number>(1000);
  private requestTimestamps = new RingBuffer<number>(1000);
  private errorTimestamps = new RingBuffer<number>(1000);
  private memoryHistory = new RingBuffer<NodeJS.MemoryUsage>(100);
  private historicalData = new RingBuffer<HistoricalData>(288); // 24 hours at 5-min intervals

  private routeMetrics = new Map<
    string,
    {
      count: number;
      latencies: number[];
      errors: number;
      lastRequest: number;
    }
  >();

  private activeRequests = 0;
  private totalRequests = 0;
  private totalErrors = 0;

  // Alert thresholds
  private highLatencyThreshold = 1000; // 1 second
  private highErrorRateThreshold = 5; // 5%
  private memoryPressureThreshold = 85; // 85% heap usage

  // Update interval
  private updateInterval: NodeJS.Timeout | null = null;
  private updateIntervalMs = 5000; // 5 seconds

  declare emit: <K extends keyof MetricsEvents>(
    event: K,
    ...args: Parameters<MetricsEvents[K]>
  ) => boolean;

  declare on: <K extends keyof MetricsEvents>(event: K, listener: MetricsEvents[K]) => this;

  constructor() {
    super();
  }

  /**
   * Start metrics collection
   */
  start(): void {
    if (this.updateInterval) return;

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
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Record a request start
   */
  recordRequestStart(): void {
    this.activeRequests++;
    this.totalRequests++;
  }

  /**
   * Record a request completion
   */
  recordRequestEnd(route: string, method: string, latency: number, isError: boolean = false): void {
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
  getLatencyMetrics(): LatencyMetrics {
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
    const variance =
      latencies.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / latencies.length;
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
  getThroughputMetrics(): ThroughputMetrics {
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
  getMemoryMetrics(): MemoryMetrics {
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
  getRouteMetrics(): RouteMetrics[] {
    const routes: RouteMetrics[] = [];

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
  getHistoricalData(hours: number = 24): HistoricalData[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.historicalData.getAll().filter((data) => data.timestamp > cutoff);
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    latency: LatencyMetrics;
    throughput: ThroughputMetrics;
    memory: MemoryMetrics;
    routes: RouteMetrics[];
  } {
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
  getMetrics(): {
    latency: LatencyMetrics;
    throughput: ThroughputMetrics;
    memory: MemoryMetrics;
    routes: RouteMetrics[];
    requestCount: number;
    errorCount: number;
    activeRequests: number;
  } {
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
  getLatencyPercentiles(): {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    avg: number;
    min: number;
    max: number;
  } {
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
  getRouteMetricsByPattern(route: string): RouteMetrics | undefined {
    const allRoutes = this.getRouteMetrics();
    return allRoutes.find((r) => r.route === route);
  }

  /**
   * Clear all metrics data
   */
  clear(): void {
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
  private calculatePercentile(sorted: number[], percentile: number): number {
    if (sorted.length === 0) return 0;

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
  private calculateLatencyMetrics(latencies: number[]): LatencyMetrics {
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
    const variance =
      latencies.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / latencies.length;

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
  private calculateMemoryTrend(): 'growing' | 'stable' | 'decreasing' {
    const history = this.memoryHistory.getAll();
    if (history.length < 2) return 'stable';

    const recent = history.slice(-10); // Last 10 samples
    if (recent.length < 2) return 'stable';

    const first = recent[0]?.heapUsed ?? 0;
    const last = recent[recent.length - 1]?.heapUsed ?? 0;
    const change = last - first;
    const changePercent = (change / first) * 100;

    if (changePercent > 5) return 'growing';
    if (changePercent < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(routeKey: string, route: string, latency: number, _isError: boolean): void {
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
  private updateMetrics(): void {
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
let globalCollector: MetricsCollector | null = null;

/**
 * Get or create the global metrics collector
 */
export function getMetricsCollector(): MetricsCollector {
  if (!globalCollector) {
    globalCollector = new MetricsCollector();
  }
  return globalCollector;
}

/**
 * Reset the global metrics collector (for testing)
 */
export function resetMetricsCollector(): void {
  if (globalCollector) {
    globalCollector.stop();
  }
  globalCollector = null;
}
