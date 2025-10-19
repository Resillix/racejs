/**
 * Performance Profiler
 *
 * CPU, memory, and event loop monitoring for development performance insights.
 * Follows Facade Pattern - simple API, complex internals.
 */

import { EventEmitter } from 'node:events';
import { performance, monitorEventLoopDelay } from 'node:perf_hooks';
import inspector from 'node:inspector';

export interface ProfilerOptions {
  /** Enable profiler */
  enabled?: boolean;

  /** Enable CPU profiling */
  cpuProfiling?: boolean;

  /** Enable memory profiling */
  memoryProfiling?: boolean;

  /** Generate flame graphs */
  flamegraphs?: boolean;

  /** Monitor event loop lag */
  eventLoopMonitoring?: boolean;

  /** Performance budgets per route */
  budgets?: Record<string, { maxLatency: number }>;

  /** Profile output directory */
  outputDir?: string;
}

export interface CPUProfile {
  /** Profile ID for reference */
  id: string;

  /** Route or operation being profiled */
  route: string;

  /** Profile start time */
  startTime: number;

  /** Profile duration in ms */
  duration: number;

  /** Raw V8 CPU profile data */
  profile: any;

  /** Generated flame graph data (if enabled) */
  flameGraph?: any;
}

export interface MemorySnapshot {
  /** Snapshot ID */
  id: string;

  /** Snapshot timestamp */
  timestamp: number;

  /** Memory usage at snapshot time */
  memoryUsage: NodeJS.MemoryUsage;

  /** Heap snapshot file path (if written) */
  heapSnapshotPath?: string;
}

export interface EventLoopMetrics {
  /** Current event loop lag in ms */
  lag: number;

  /** Minimum lag observed */
  min: number;

  /** Maximum lag observed */
  max: number;

  /** Mean lag */
  mean: number;

  /** Standard deviation */
  stddev: number;

  /** 99th percentile lag */
  p99: number;
}

export interface PerformanceBudget {
  /** Route pattern */
  route: string;

  /** Maximum allowed latency in ms */
  maxLatency: number;

  /** Number of violations */
  violations: number;

  /** Last violation timestamp */
  lastViolation?: number;
}

export interface ProfilerEvents {
  'cpu-profile-started': (profile: { id: string; route: string }) => void;
  'cpu-profile-completed': (profile: CPUProfile) => void;
  'memory-snapshot': (snapshot: MemorySnapshot) => void;
  'budget-exceeded': (violation: { route: string; latency: number; budget: number }) => void;
  'slow-route': (data: { route: string; latency: number; threshold: number }) => void;
  'memory-leak': (data: { growth: number; threshold: number }) => void;
  'event-loop-lag': (metrics: EventLoopMetrics) => void;
}

/**
 * Performance Profiler
 *
 * Provides CPU profiling, memory monitoring, and event loop lag detection.
 * Emits events for performance insights and budget violations.
 */
export class PerformanceProfiler extends EventEmitter {
  private options: Required<ProfilerOptions>;
  private session: inspector.Session | null = null;
  private cpuProfiles: Map<string, CPUProfile> = new Map();
  private memorySnapshots: MemorySnapshot[] = [];
  private eventLoopMonitor: any = null;
  private budgets: Map<string, PerformanceBudget> = new Map();
  private lastMemoryUsage: NodeJS.MemoryUsage | null = null;
  private memoryGrowthThreshold = 50 * 1024 * 1024; // 50MB
  private running = false;

  declare emit: <K extends keyof ProfilerEvents>(
    event: K,
    ...args: Parameters<ProfilerEvents[K]>
  ) => boolean;

  declare on: <K extends keyof ProfilerEvents>(event: K, listener: ProfilerEvents[K]) => this;

  constructor(options: ProfilerOptions = {}) {
    super();

    this.options = {
      enabled: options.enabled !== false,
      cpuProfiling: options.cpuProfiling !== false,
      memoryProfiling: options.memoryProfiling !== false,
      flamegraphs: options.flamegraphs !== false,
      eventLoopMonitoring: options.eventLoopMonitoring !== false,
      budgets: options.budgets || {},
      outputDir: options.outputDir || './.racejs/profiles',
    };

    // Initialize performance budgets
    for (const [route, budget] of Object.entries(this.options.budgets)) {
      this.budgets.set(route, {
        route,
        maxLatency: budget.maxLatency,
        violations: 0,
      });
    }
  }

  /**
   * Start the profiler
   */
  async start(): Promise<void> {
    if (this.running || !this.options.enabled) {
      return;
    }

    // Initialize inspector session for CPU profiling
    if (this.options.cpuProfiling) {
      this.session = new inspector.Session();
      this.session.connect();
    }

    // Start event loop monitoring
    if (this.options.eventLoopMonitoring) {
      this.startEventLoopMonitoring();
    }

    // Start memory monitoring
    if (this.options.memoryProfiling) {
      this.startMemoryMonitoring();
    }

    this.running = true;
  }

  /**
   * Stop the profiler
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    // Stop event loop monitoring
    if (this.eventLoopMonitor) {
      this.eventLoopMonitor.disable();
      this.eventLoopMonitor = null;
    }

    // Disconnect inspector session
    if (this.session) {
      this.session.disconnect();
      this.session = null;
    }

    this.running = false;
  }

  /**
   * Start CPU profiling for a specific route
   */
  startCPUProfile(route: string): string {
    if (!this.session || !this.options.cpuProfiling) {
      throw new Error('CPU profiling not enabled or session not available');
    }

    const id = `cpu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();

    // Start V8 CPU profiler
    this.session.post('Profiler.enable');
    this.session.post('Profiler.start');

    const profile: CPUProfile = {
      id,
      route,
      startTime,
      duration: 0,
      profile: null,
    };

    this.cpuProfiles.set(id, profile);
    this.emit('cpu-profile-started', { id, route });

    return id;
  }

  /**
   * Stop CPU profiling and generate profile
   */
  async stopCPUProfile(id: string): Promise<CPUProfile> {
    if (!this.session || !this.options.cpuProfiling) {
      throw new Error('CPU profiling not enabled or session not available');
    }

    const profile = this.cpuProfiles.get(id);
    if (!profile) {
      throw new Error(`CPU profile ${id} not found`);
    }

    return new Promise((resolve, reject) => {
      this.session!.post('Profiler.stop', (err, { profile: rawProfile }) => {
        if (err) {
          reject(err);
          return;
        }

        profile.duration = performance.now() - profile.startTime;
        profile.profile = rawProfile;

        // Generate flame graph if enabled
        if (this.options.flamegraphs) {
          profile.flameGraph = this.generateFlameGraphData(rawProfile);
        }

        this.cpuProfiles.set(id, profile);
        this.emit('cpu-profile-completed', profile);
        resolve(profile);
      });
    });
  }

  /**
   * Take a memory snapshot
   */
  async takeMemorySnapshot(): Promise<MemorySnapshot> {
    const snapshot: MemorySnapshot = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
    };

    this.memorySnapshots.push(snapshot);

    // Emit snapshot event
    this.emit('memory-snapshot', snapshot);

    return snapshot;
  }

  /**
   * Check performance budget for a route
   */
  checkBudget(route: string, latency: number): void {
    // Check exact route match first
    let budget = this.budgets.get(route);

    // If no exact match, check pattern matches
    if (!budget) {
      for (const [pattern, budgetData] of this.budgets) {
        if (this.matchRoute(route, pattern)) {
          budget = budgetData;
          break;
        }
      }
    }

    if (budget && latency > budget.maxLatency) {
      budget.violations++;
      budget.lastViolation = Date.now();

      this.emit('budget-exceeded', {
        route,
        latency,
        budget: budget.maxLatency,
      });
    }

    // Emit slow route warning for routes over 1000ms
    if (latency > 1000) {
      this.emit('slow-route', {
        route,
        latency,
        threshold: 1000,
      });
    }
  }

  /**
   * Get all CPU profiles
   */
  getCPUProfiles(): CPUProfile[] {
    return Array.from(this.cpuProfiles.values());
  }

  /**
   * Get all memory snapshots
   */
  getMemorySnapshots(): MemorySnapshot[] {
    return [...this.memorySnapshots];
  }

  /**
   * Get performance budgets status
   */
  getBudgets(): PerformanceBudget[] {
    return Array.from(this.budgets.values());
  }

  /**
   * Get current event loop metrics
   */
  getEventLoopMetrics(): EventLoopMetrics | null {
    if (!this.eventLoopMonitor) {
      return null;
    }

    return {
      lag: this.eventLoopMonitor.lag,
      min: this.eventLoopMonitor.min,
      max: this.eventLoopMonitor.max,
      mean: this.eventLoopMonitor.mean,
      stddev: this.eventLoopMonitor.stddev,
      p99: this.eventLoopMonitor.percentile(99),
    };
  }

  /**
   * Get event loop stats (alias for getEventLoopMetrics)
   */
  getEventLoopStats(): EventLoopMetrics | null {
    return this.getEventLoopMetrics();
  }

  /**
   * Get memory snapshot (returns Node.js memory usage directly for easy access)
   */
  getMemorySnapshot(): NodeJS.MemoryUsage & { heapTotal: number; heapUsed: number } {
    const mem = process.memoryUsage();
    return {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
    };
  }

  /**
   * Check if profiler is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Start profiling a route
   */
  startRoute(route: string): string {
    if (!this.options.cpuProfiling) {
      // If CPU profiling is disabled, just return a dummy ID
      return `route-${Date.now()}`;
    }
    return this.startCPUProfile(route);
  }

  /**
   * End profiling a route
   */
  async endRoute(profileId: string): Promise<CPUProfile | null> {
    if (!this.options.cpuProfiling) {
      return null;
    }
    try {
      return await this.stopCPUProfile(profileId);
    } catch {
      return null;
    }
  }

  /**
   * Clear old profiles and snapshots
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;

    // Clean up CPU profiles
    for (const [id, profile] of this.cpuProfiles) {
      if (profile.startTime < cutoff) {
        this.cpuProfiles.delete(id);
      }
    }

    // Clean up memory snapshots
    this.memorySnapshots = this.memorySnapshots.filter((snapshot) => snapshot.timestamp > cutoff);
  }

  /**
   * Start event loop lag monitoring
   */
  private startEventLoopMonitoring(): void {
    this.eventLoopMonitor = monitorEventLoopDelay({ resolution: 20 });
    this.eventLoopMonitor.enable();

    // Emit metrics every 5 seconds
    setInterval(() => {
      const metrics = this.getEventLoopMetrics();
      if (metrics) {
        this.emit('event-loop-lag', metrics);

        // Reset monitor for next interval
        this.eventLoopMonitor.reset();
      }
    }, 5000);
  }

  /**
   * Start memory monitoring for leak detection
   */
  private startMemoryMonitoring(): void {
    // Monitor memory every 30 seconds
    setInterval(() => {
      const currentMemory = process.memoryUsage();

      if (this.lastMemoryUsage) {
        const growth = currentMemory.heapUsed - this.lastMemoryUsage.heapUsed;

        if (growth > this.memoryGrowthThreshold) {
          this.emit('memory-leak', {
            growth,
            threshold: this.memoryGrowthThreshold,
          });
        }
      }

      this.lastMemoryUsage = currentMemory;

      // Auto-snapshot on significant memory growth
      if (
        this.lastMemoryUsage &&
        currentMemory.heapUsed > this.lastMemoryUsage.heapUsed + this.memoryGrowthThreshold
      ) {
        this.takeMemorySnapshot();
      }
    }, 30000);
  }

  /**
   * Generate flame graph data from V8 CPU profile
   */
  private generateFlameGraphData(profile: any): any {
    // Simplified flame graph generation
    // In a real implementation, this would parse the V8 profile format
    // and generate flame graph compatible data

    const frames: any[] = [];

    if (profile.nodes) {
      for (const node of profile.nodes) {
        if (node.callFrame) {
          frames.push({
            name: `${node.callFrame.functionName || 'anonymous'}`,
            file: node.callFrame.url || 'unknown',
            line: node.callFrame.lineNumber || 0,
            column: node.callFrame.columnNumber || 0,
            hitCount: node.hitCount || 0,
          });
        }
      }
    }

    return {
      type: 'flamegraph',
      frames,
      duration: profile.endTime - profile.startTime,
    };
  }

  /**
   * Match route against pattern (supports wildcards)
   */
  private matchRoute(route: string, pattern: string): boolean {
    // Convert pattern to regex (simple wildcard support)
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$');
    return regex.test(route);
  }
}

/**
 * Create a performance profiler instance
 */
export function createProfiler(options?: ProfilerOptions): PerformanceProfiler {
  return new PerformanceProfiler(options);
}
