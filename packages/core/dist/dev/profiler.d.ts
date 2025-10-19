/**
 * Performance Profiler
 *
 * CPU, memory, and event loop monitoring for development performance insights.
 * Follows Facade Pattern - simple API, complex internals.
 */
import { EventEmitter } from 'node:events';
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
    budgets?: Record<string, {
        maxLatency: number;
    }>;
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
    'cpu-profile-started': (profile: {
        id: string;
        route: string;
    }) => void;
    'cpu-profile-completed': (profile: CPUProfile) => void;
    'memory-snapshot': (snapshot: MemorySnapshot) => void;
    'budget-exceeded': (violation: {
        route: string;
        latency: number;
        budget: number;
    }) => void;
    'slow-route': (data: {
        route: string;
        latency: number;
        threshold: number;
    }) => void;
    'memory-leak': (data: {
        growth: number;
        threshold: number;
    }) => void;
    'event-loop-lag': (metrics: EventLoopMetrics) => void;
}
/**
 * Performance Profiler
 *
 * Provides CPU profiling, memory monitoring, and event loop lag detection.
 * Emits events for performance insights and budget violations.
 */
export declare class PerformanceProfiler extends EventEmitter {
    private options;
    private session;
    private cpuProfiles;
    private memorySnapshots;
    private eventLoopMonitor;
    private budgets;
    private lastMemoryUsage;
    private memoryGrowthThreshold;
    private running;
    emit: <K extends keyof ProfilerEvents>(event: K, ...args: Parameters<ProfilerEvents[K]>) => boolean;
    on: <K extends keyof ProfilerEvents>(event: K, listener: ProfilerEvents[K]) => this;
    constructor(options?: ProfilerOptions);
    /**
     * Start the profiler
     */
    start(): Promise<void>;
    /**
     * Stop the profiler
     */
    stop(): Promise<void>;
    /**
     * Start CPU profiling for a specific route
     */
    startCPUProfile(route: string): string;
    /**
     * Stop CPU profiling and generate profile
     */
    stopCPUProfile(id: string): Promise<CPUProfile>;
    /**
     * Take a memory snapshot
     */
    takeMemorySnapshot(): Promise<MemorySnapshot>;
    /**
     * Check performance budget for a route
     */
    checkBudget(route: string, latency: number): void;
    /**
     * Get all CPU profiles
     */
    getCPUProfiles(): CPUProfile[];
    /**
     * Get all memory snapshots
     */
    getMemorySnapshots(): MemorySnapshot[];
    /**
     * Get performance budgets status
     */
    getBudgets(): PerformanceBudget[];
    /**
     * Get current event loop metrics
     */
    getEventLoopMetrics(): EventLoopMetrics | null;
    /**
     * Get event loop stats (alias for getEventLoopMetrics)
     */
    getEventLoopStats(): EventLoopMetrics | null;
    /**
     * Get memory snapshot (returns Node.js memory usage directly for easy access)
     */
    getMemorySnapshot(): NodeJS.MemoryUsage & {
        heapTotal: number;
        heapUsed: number;
    };
    /**
     * Check if profiler is running
     */
    isRunning(): boolean;
    /**
     * Start profiling a route
     */
    startRoute(route: string): string;
    /**
     * End profiling a route
     */
    endRoute(profileId: string): Promise<CPUProfile | null>;
    /**
     * Clear old profiles and snapshots
     */
    cleanup(maxAge?: number): void;
    /**
     * Start event loop lag monitoring
     */
    private startEventLoopMonitoring;
    /**
     * Start memory monitoring for leak detection
     */
    private startMemoryMonitoring;
    /**
     * Generate flame graph data from V8 CPU profile
     */
    private generateFlameGraphData;
    /**
     * Match route against pattern (supports wildcards)
     */
    private matchRoute;
}
/**
 * Create a performance profiler instance
 */
export declare function createProfiler(options?: ProfilerOptions): PerformanceProfiler;
//# sourceMappingURL=profiler.d.ts.map