/**
 * Dev Mode Configuration Types
 *
 * Central configuration for all dev mode features
 */

import type { DevLogger, DevLoggerOptions } from './logger.js';

export interface DevModeOptions {
  /** Enable dev mode */
  enabled?: boolean;

  /** Verbose output */
  verbose?: boolean;

  /** Logger configuration */
  logger?: DevLoggerOptions | DevLogger;

  /** DevTools UI configuration */
  devtools?: DevToolsOptions | boolean;

  /** Request recorder configuration */
  recorder?: RecorderOptions | boolean;

  /** Performance profiler configuration */
  profiler?: ProfilerOptions | boolean;

  /** Error handler configuration */
  errorHandler?: ErrorHandlerOptions | boolean;
}

export interface DevToolsOptions {
  /** Enable DevTools UI */
  enabled?: boolean;

  /** Host for DevTools server */
  host?: string;

  /** Port for DevTools server (0 = use same port as app) */
  port?: number;

  /** Path to mount DevTools UI */
  path?: string;

  /** Enable WebSocket for real-time updates */
  websocket?: boolean;

  /** Authentication token for DevTools access */
  auth?: string;

  /** Automatically open browser when server starts */
  autoOpen?: boolean;
}

export interface RecorderOptions {
  /** Enable request recording */
  enabled?: boolean;

  /** Maximum number of requests to keep */
  maxRequests?: number;

  /** Storage backend */
  storage?: 'memory' | 'sqlite' | 'redis';

  /** Storage path for SQLite */
  storePath?: string;

  /** Record request bodies */
  recordBody?: boolean;

  /** Record request headers */
  recordHeaders?: boolean;

  /** Paths to exclude from recording */
  excludePaths?: string[];
}

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
}

export interface ErrorHandlerOptions {
  /** Enable pretty error pages */
  prettyErrors?: boolean;

  /** Enable source map support */
  sourceMaps?: boolean;

  /** Enable AI suggestions */
  aiSuggestions?: boolean;

  /** Track errors for aggregation */
  trackErrors?: boolean;
}

/**
 * Normalize dev mode options with defaults
 */
export function normalizeDevModeOptions(
  options: boolean | DevModeOptions | undefined
): DevModeOptions | null {
  // Disabled
  if (options === false) return null;

  // Auto-enable in development
  const isDev = process.env.NODE_ENV !== 'production';

  // Simple boolean enable
  if (options === true || options === undefined) {
    return isDev ? { enabled: true } : null;
  }

  // Object config
  if (!isDev && !options.enabled) return null;

  return {
    enabled: true,
    verbose: options.verbose ?? isDev,
    ...options,
  };
}
