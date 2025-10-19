/**
 * Flame Graph Generator
 *
 * Parses V8 CPU profiles and generates flame graph data for visualization.
 * Follows Builder Pattern - construct flame graph data step by step.
 */
export interface FlameGraphNode {
    /** Function name */
    name: string;
    /** File path */
    file?: string;
    /** Line number */
    line?: number;
    /** Column number */
    column?: number;
    /** Execution time in microseconds */
    time: number;
    /** Child nodes */
    children: FlameGraphNode[];
    /** Parent node reference */
    parent?: FlameGraphNode;
    /** Stack depth */
    depth: number;
    /** Percentage of total time */
    percentage: number;
    /** Hit count from profiler */
    hitCount: number;
}
export interface FlameGraphData {
    /** Root node containing all stack traces */
    root: FlameGraphNode;
    /** Total execution time */
    totalTime: number;
    /** Profile metadata */
    metadata: {
        startTime: number;
        endTime: number;
        duration: number;
        sampleCount: number;
        route?: string;
    };
    /** Flat list of all nodes for easy processing */
    nodes: FlameGraphNode[];
}
export interface SpeedscopeProfile {
    /** Speedscope format version */
    $schema: string;
    /** Shared frame data */
    shared: {
        frames: Array<{
            name: string;
            file?: string;
            line?: number;
            col?: number;
        }>;
    };
    /** Profile data */
    profiles: Array<{
        type: 'sampled';
        name: string;
        unit: 'microseconds';
        startValue: number;
        endValue: number;
        samples: Array<{
            stack: number[];
            weight: number;
        }>;
        weights: number[];
    }>;
}
/**
 * Flame Graph Generator
 *
 * Converts V8 CPU profiles to flame graph format for visualization.
 */
export declare class FlameGraphGenerator {
    /**
     * Parse V8 CPU profile and generate flame graph data
     */
    parseProfile(profile: any, route?: string): FlameGraphData;
    /**
     * Generate D3.js compatible flame graph data
     */
    generateD3FlameGraph(flameGraphData: FlameGraphData): any;
    /**
     * Export to Speedscope format
     */
    exportToSpeedscope(flameGraphData: FlameGraphData): SpeedscopeProfile;
    /**
     * Generate flame graph from simple timing data
     */
    generateFromTimings(timings: Array<{
        name: string;
        duration: number;
        children?: any[];
    }>): FlameGraphData;
    /**
     * Format function name for display
     */
    private formatFunctionName;
    /**
     * Calculate depth and percentage metrics
     */
    private calculateMetrics;
    /**
     * Collect all nodes in a flat list
     */
    private collectNodes;
    /**
     * Convert to D3.js format
     */
    private convertToD3Format;
    /**
     * Generate samples for Speedscope format
     */
    private generateSamples;
    /**
     * Create flame graph node from timing data
     */
    private createNodeFromTiming;
}
/**
 * Get or create the global flame graph generator
 */
export declare function getFlameGraphGenerator(): FlameGraphGenerator;
/**
 * Parse V8 CPU profile and generate flame graph
 */
export declare function parseProfile(profile: any, route?: string): FlameGraphData;
/**
 * Generate D3 compatible flame graph data
 */
export declare function generateD3FlameGraph(flameGraphData: FlameGraphData): any;
/**
 * Export flame graph to Speedscope format
 */
export declare function exportToSpeedscope(flameGraphData: FlameGraphData): SpeedscopeProfile;
//# sourceMappingURL=profiler-flamegraph.d.ts.map