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
export class FlameGraphGenerator {
  /**
   * Parse V8 CPU profile and generate flame graph data
   */
  parseProfile(profile: any, route?: string): FlameGraphData {
    if (!profile || !profile.nodes) {
      throw new Error('Invalid V8 CPU profile format');
    }

    // Create node lookup map
    const nodeMap = new Map<number, any>();
    for (const node of profile.nodes) {
      nodeMap.set(node.id, node);
    }

    // Build frame lookup
    const frames = new Map<number, FlameGraphNode>();

    // Create root node
    const root: FlameGraphNode = {
      name: '(root)',
      time: 0,
      children: [],
      depth: 0,
      percentage: 100,
      hitCount: 0,
    };

    frames.set(-1, root);

    // Calculate total time
    const startTime = profile.startTime || 0;
    const endTime = profile.endTime || startTime + 1000000; // Default 1 second
    const totalTime = endTime - startTime;

    // Process each node
    for (const node of profile.nodes) {
      const callFrame = node.callFrame || {};

      const flameNode: FlameGraphNode = {
        name: this.formatFunctionName(callFrame),
        file: callFrame.url || undefined,
        line: callFrame.lineNumber || undefined,
        column: callFrame.columnNumber || undefined,
        time: (node.hitCount || 0) * (profile.sampleInterval || 1000), // Convert to microseconds
        children: [],
        depth: 0,
        percentage: 0,
        hitCount: node.hitCount || 0,
      };

      frames.set(node.id, flameNode);
    }

    // Build tree structure
    for (const node of profile.nodes) {
      const flameNode = frames.get(node.id)!;

      if (node.children && node.children.length > 0) {
        for (const childId of node.children) {
          const childNode = frames.get(childId);
          if (childNode) {
            childNode.parent = flameNode;
            flameNode.children.push(childNode);
          }
        }
      } else {
        // Leaf node, attach to root if no parent found
        if (!flameNode.parent) {
          flameNode.parent = root;
          root.children.push(flameNode);
        }
      }
    }

    // Calculate depths and percentages
    this.calculateMetrics(root, totalTime);

    // Collect all nodes in flat list
    const allNodes = this.collectNodes(root);

    const metadata: {
      startTime: number;
      endTime: number;
      duration: number;
      sampleCount: number;
      route?: string;
    } = {
      startTime,
      endTime,
      duration: totalTime,
      sampleCount: profile.samples?.length || 0,
    };

    // Only add route if it exists
    if (route) {
      metadata.route = route;
    }

    return {
      root,
      totalTime,
      metadata,
      nodes: allNodes,
    };
  }

  /**
   * Generate D3.js compatible flame graph data
   */
  generateD3FlameGraph(flameGraphData: FlameGraphData): any {
    const d3Data = {
      name: flameGraphData.root.name,
      value: flameGraphData.totalTime,
      children: this.convertToD3Format(flameGraphData.root.children),
    };

    return d3Data;
  }

  /**
   * Export to Speedscope format
   */
  exportToSpeedscope(flameGraphData: FlameGraphData): SpeedscopeProfile {
    const frames: Array<{ name: string; file?: string; line?: number; col?: number }> = [];
    const frameMap = new Map<string, number>();

    // Collect unique frames
    for (const node of flameGraphData.nodes) {
      const frameKey = `${node.name}:${node.file || ''}:${node.line || 0}:${node.column || 0}`;

      if (!frameMap.has(frameKey)) {
        const frameIndex = frames.length;
        frameMap.set(frameKey, frameIndex);

        const frame: { name: string; file?: string; line?: number; col?: number } = {
          name: node.name,
        };

        // Only add optional properties if they exist
        if (node.file) frame.file = node.file;
        if (node.line !== undefined) frame.line = node.line;
        if (node.column !== undefined) frame.col = node.column;

        frames.push(frame);
      }
    }

    // Generate samples
    const samples: Array<{ stack: number[]; weight: number }> = [];
    const weights: number[] = [];

    // Convert flame graph to samples
    this.generateSamples(flameGraphData.root, frameMap, [], samples, weights);

    return {
      $schema: 'https://www.speedscope.app/file-format-schema.json',
      shared: { frames },
      profiles: [
        {
          type: 'sampled',
          name: flameGraphData.metadata.route || 'CPU Profile',
          unit: 'microseconds',
          startValue: flameGraphData.metadata.startTime,
          endValue: flameGraphData.metadata.endTime,
          samples,
          weights,
        },
      ],
    };
  }

  /**
   * Generate flame graph from simple timing data
   */
  generateFromTimings(
    timings: Array<{
      name: string;
      duration: number;
      children?: any[];
    }>
  ): FlameGraphData {
    const root: FlameGraphNode = {
      name: '(root)',
      time: 0,
      children: [],
      depth: 0,
      percentage: 100,
      hitCount: 0,
    };

    let totalTime = 0;

    // Convert timings to flame graph nodes
    for (const timing of timings) {
      const node = this.createNodeFromTiming(timing, 1);
      root.children.push(node);
      node.parent = root;
      totalTime += node.time;
    }

    root.time = totalTime;

    // Calculate metrics
    this.calculateMetrics(root, totalTime);

    return {
      root,
      totalTime,
      metadata: {
        startTime: 0,
        endTime: totalTime,
        duration: totalTime,
        sampleCount: timings.length,
      },
      nodes: this.collectNodes(root),
    };
  }

  /**
   * Format function name for display
   */
  private formatFunctionName(callFrame: any): string {
    const functionName = callFrame.functionName || '(anonymous)';
    const url = callFrame.url || '';

    // Extract filename from URL
    if (url) {
      const filename = url.split('/').pop() || url;
      return `${functionName} (${filename})`;
    }

    return functionName;
  }

  /**
   * Calculate depth and percentage metrics
   */
  private calculateMetrics(node: FlameGraphNode, totalTime: number, depth: number = 0): void {
    node.depth = depth;
    node.percentage = totalTime > 0 ? (node.time / totalTime) * 100 : 0;

    for (const child of node.children) {
      this.calculateMetrics(child, totalTime, depth + 1);
    }
  }

  /**
   * Collect all nodes in a flat list
   */
  private collectNodes(root: FlameGraphNode): FlameGraphNode[] {
    const nodes: FlameGraphNode[] = [];

    const visit = (node: FlameGraphNode) => {
      nodes.push(node);
      for (const child of node.children) {
        visit(child);
      }
    };

    visit(root);
    return nodes;
  }

  /**
   * Convert to D3.js format
   */
  private convertToD3Format(nodes: FlameGraphNode[]): any[] {
    return nodes.map((node) => ({
      name: node.name,
      value: node.time,
      percentage: node.percentage,
      hitCount: node.hitCount,
      file: node.file,
      line: node.line,
      children: node.children.length > 0 ? this.convertToD3Format(node.children) : undefined,
    }));
  }

  /**
   * Generate samples for Speedscope format
   */
  private generateSamples(
    node: FlameGraphNode,
    frameMap: Map<string, number>,
    stack: number[],
    samples: Array<{ stack: number[]; weight: number }>,
    weights: number[]
  ): void {
    const frameKey = `${node.name}:${node.file || ''}:${node.line || 0}:${node.column || 0}`;
    const frameIndex = frameMap.get(frameKey);

    if (frameIndex !== undefined) {
      const newStack = [...stack, frameIndex];

      if (node.children.length === 0) {
        // Leaf node - create sample
        samples.push({
          stack: newStack,
          weight: node.time,
        });
        weights.push(node.time);
      } else {
        // Continue with children
        for (const child of node.children) {
          this.generateSamples(child, frameMap, newStack, samples, weights);
        }
      }
    }
  }

  /**
   * Create flame graph node from timing data
   */
  private createNodeFromTiming(timing: any, depth: number): FlameGraphNode {
    const node: FlameGraphNode = {
      name: timing.name,
      time: timing.duration * 1000, // Convert to microseconds
      children: [],
      depth,
      percentage: 0,
      hitCount: 1,
    };

    if (timing.children) {
      for (const child of timing.children) {
        const childNode = this.createNodeFromTiming(child, depth + 1);
        childNode.parent = node;
        node.children.push(childNode);
      }
    }

    return node;
  }
}

/**
 * Global flame graph generator instance
 */
let globalGenerator: FlameGraphGenerator | null = null;

/**
 * Get or create the global flame graph generator
 */
export function getFlameGraphGenerator(): FlameGraphGenerator {
  if (!globalGenerator) {
    globalGenerator = new FlameGraphGenerator();
  }
  return globalGenerator;
}

/**
 * Parse V8 CPU profile and generate flame graph
 */
export function parseProfile(profile: any, route?: string): FlameGraphData {
  return getFlameGraphGenerator().parseProfile(profile, route);
}

/**
 * Generate D3 compatible flame graph data
 */
export function generateD3FlameGraph(flameGraphData: FlameGraphData): any {
  return getFlameGraphGenerator().generateD3FlameGraph(flameGraphData);
}

/**
 * Export flame graph to Speedscope format
 */
export function exportToSpeedscope(flameGraphData: FlameGraphData): SpeedscopeProfile {
  return getFlameGraphGenerator().exportToSpeedscope(flameGraphData);
}
