/**
 * @fileoverview ErrorAggregator - Groups and tracks errors
 *
 * Groups identical errors by stack trace hash, tracks frequency,
 * detects trends, and provides error statistics.
 *
 * @module dev/error/error-aggregator
 */

import { EventEmitter } from 'node:events';
import { createHash } from 'node:crypto';
import type {
  AggregatedError,
  ErrorContext,
  ErrorFilter,
  ErrorStats,
  ErrorOccurrence,
  ErrorStorage,
} from './types.js';

/**
 * Error aggregator for grouping and tracking errors
 *
 * Groups identical errors by stack trace hash, tracks occurrence frequency,
 * detects error trends and spikes, and provides statistics.
 *
 * @example
 * ```typescript
 * const aggregator = new ErrorAggregator();
 *
 * // Track an error
 * const hash = aggregator.track(error, {
 *   route: '/api/users',
 *   method: 'GET',
 *   timestamp: Date.now()
 * });
 *
 * // Get statistics
 * const stats = aggregator.getStats();
 * console.log(`Total errors: ${stats.totalErrors}`);
 * ```
 *
 * @fires ErrorAggregator#error-tracked
 * @fires ErrorAggregator#error-spike
 * @fires ErrorAggregator#new-error-type
 */
export class ErrorAggregator extends EventEmitter {
  private errors: Map<string, AggregatedError>;
  private storage?: ErrorStorage;
  private maxErrors: number;
  private maxOccurrences: number;

  /**
   * Creates a new ErrorAggregator
   *
   * @param storage - Optional storage backend
   * @param maxErrors - Maximum number of unique errors to track (default: 1000)
   * @param maxOccurrences - Maximum occurrences per error (default: 100)
   */
  constructor(storage?: ErrorStorage, maxErrors: number = 1000, maxOccurrences: number = 100) {
    super();
    this.errors = new Map();

    if (storage) {
      this.storage = storage;
    }

    this.maxErrors = maxErrors;
    this.maxOccurrences = maxOccurrences;
  }

  /**
   * Track an error occurrence
   *
   * Generates a hash for the error, updates occurrence count,
   * detects trends and spikes, and emits events.
   *
   * @param error - Error to track
   * @param context - Error context
   * @returns Error hash
   */
  track(error: Error, context: ErrorContext): string {
    const hash = this.generateHash(error);
    const timestamp = context.timestamp || Date.now();

    let aggregated = this.errors.get(hash);
    const isNew = !aggregated;

    if (isNew) {
      // Create new aggregated error
      aggregated = {
        hash,
        message: error.message,
        stack: error.stack || '',
        type: error.name,
        count: 1, // Initialize to 1 for first occurrence
        firstSeen: timestamp,
        lastSeen: timestamp,
        occurrences: [],
        status: 'active',
        severity: this.determineSeverity(error, context),
        routes: new Map(),
        trend: 'stable',
        // Convenience fields from first occurrence
        route: context.route,
        method: context.method,
      };

      this.errors.set(hash, aggregated);

      // Evict oldest error if limit reached
      if (this.errors.size > this.maxErrors) {
        this.evictOldest();
      }
    }

    // Type guard - aggregated is now defined
    if (!aggregated) {
      return hash;
    }

    // Update aggregated error (skip increment for new errors)
    if (!isNew) {
      aggregated.count++;
    }
    aggregated.lastSeen = timestamp;

    // Add occurrence
    const occurrence: ErrorOccurrence = {
      timestamp,
      requestId: context.requestId || 'unknown',
      route: context.route,
      method: context.method,
      context: context,
    };

    aggregated.occurrences.push(occurrence);

    // Keep only last N occurrences
    if (aggregated.occurrences.length > this.maxOccurrences) {
      aggregated.occurrences.shift();
    }

    // Update routes
    const routeCount = aggregated.routes.get(context.route) || 0;
    aggregated.routes.set(context.route, routeCount + 1);

    // Detect trend
    aggregated.trend = this.detectTrend(aggregated);

    // Emit new error type event (after first occurrence is tracked)
    if (isNew) {
      this.emit('new-error-type', { error: aggregated });
    }

    // Check for spike
    if (this.checkForSpike(aggregated)) {
      this.emit('error-spike', { error: aggregated });
    }

    // Store if storage backend configured
    if (this.storage) {
      void this.storage.store(aggregated);
    }

    // Emit tracked event
    this.emit('error-tracked', { hash, error: aggregated, context });

    return hash;
  }

  /**
   * Generate hash for error based on stack trace
   *
   * Normalizes the stack trace by removing line numbers and timestamps
   * to group similar errors together.
   *
   * @param error - Error to hash
   * @returns Hash string
   */
  private generateHash(error: Error): string {
    // Normalize stack trace (remove line numbers, timestamps)
    const normalizedStack = error.stack
      ?.split('\n')
      .filter((line) => !line.includes('node_modules'))
      .map((line) => {
        // Remove line:column numbers
        return line.replace(/:\d+:\d+/g, '');
      })
      .join('\n');

    const content = normalizedStack || error.message || error.name || 'UnknownError';

    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Determine error severity based on error type and context
   *
   * @param error - Error object
   * @param context - Error context
   * @returns Severity level
   */
  private determineSeverity(error: Error, context: ErrorContext): 'critical' | 'warning' | 'info' {
    // Check for critical error types
    const criticalTypes = ['ReferenceError', 'TypeError', 'SyntaxError', 'RangeError'];

    if (criticalTypes.includes(error.name)) {
      return 'critical';
    }

    // Check status code if available
    const statusCode = (context as { statusCode?: number }).statusCode;
    if (statusCode) {
      if (statusCode >= 500) {
        return 'critical';
      }
      if (statusCode >= 400) {
        return 'warning';
      }
    }

    return 'warning';
  }

  /**
   * Detect error trend (increasing/stable/decreasing)
   *
   * Compares recent error rate to previous rate to determine trend.
   *
   * @param error - Aggregated error
   * @returns Trend direction
   */
  private detectTrend(error: AggregatedError): 'increasing' | 'stable' | 'decreasing' {
    // Need at least 10 occurrences to detect trend
    if (error.occurrences.length < 10) {
      return 'stable';
    }

    const recent = error.occurrences.slice(-10);
    const previous = error.occurrences.slice(-20, -10);

    if (previous.length === 0) {
      return 'stable';
    }

    // Calculate average time between errors
    const recentFirst = recent[0];
    const recentLast = recent[recent.length - 1];
    const previousFirst = previous[0];
    const previousLast = previous[previous.length - 1];

    if (!recentFirst || !recentLast || !previousFirst || !previousLast) {
      return 'stable';
    }

    const recentTime = recentLast.timestamp - recentFirst.timestamp;
    const previousTime = previousLast.timestamp - previousFirst.timestamp;

    const recentAvgInterval = recentTime / recent.length;
    const previousAvgInterval = previousTime / previous.length;

    // If errors are happening faster (shorter interval), trend is increasing
    if (recentAvgInterval < previousAvgInterval * 0.7) {
      return 'increasing';
    }

    // If errors are happening slower (longer interval), trend is decreasing
    if (recentAvgInterval > previousAvgInterval * 1.3) {
      return 'decreasing';
    }

    return 'stable';
  }

  /**
   * Check if error is experiencing a spike (10x normal rate)
   *
   * @param error - Aggregated error
   * @returns True if spike detected
   */
  private checkForSpike(error: AggregatedError): boolean {
    // Need at least 10 occurrences to detect spike
    if (error.occurrences.length < 10) {
      return false;
    }

    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    // Count recent errors (last 5 minutes)
    const recentCount = error.occurrences.filter((o) => o.timestamp > fiveMinutesAgo).length;

    // Calculate average rate (errors per minute)
    const totalDuration = now - error.firstSeen;
    const avgErrorsPerMinute = (error.count / totalDuration) * 60 * 1000;

    // Spike if recent rate is 10x average
    return recentCount > avgErrorsPerMinute * 5 * 10;
  }

  /**
   * Evict oldest error to maintain size limit
   */
  private evictOldest(): void {
    let oldestHash: string | null = null;
    let oldestTime = Date.now();

    for (const [hash, error] of this.errors) {
      if (error.status === 'resolved' || error.status === 'ignored') {
        // Prefer evicting resolved/ignored errors
        oldestHash = hash;
        break;
      }

      if (error.lastSeen < oldestTime) {
        oldestTime = error.lastSeen;
        oldestHash = hash;
      }
    }

    if (oldestHash) {
      this.errors.delete(oldestHash);
    }
  }

  /**
   * Get error by hash
   *
   * @param hash - Error hash
   * @returns Aggregated error or null
   */
  getError(hash: string): AggregatedError | null {
    return this.errors.get(hash) || null;
  }

  /**
   * List errors with optional filtering
   *
   * @param filter - Optional filter criteria
   * @returns Array of aggregated errors
   */
  listErrors(filter?: ErrorFilter): AggregatedError[] {
    let errors = Array.from(this.errors.values());

    if (!filter) {
      return errors;
    }

    // Apply filters
    if (filter.status) {
      errors = errors.filter((e) => e.status === filter.status);
    }

    if (filter.severity) {
      errors = errors.filter((e) => e.severity === filter.severity);
    }

    if (filter.route) {
      errors = errors.filter((e) => e.routes.has(filter.route!));
    }

    if (filter.type) {
      errors = errors.filter((e) => e.type === filter.type);
    }

    if (filter.fromDate) {
      errors = errors.filter((e) => e.firstSeen >= filter.fromDate!);
    }

    if (filter.toDate) {
      errors = errors.filter((e) => e.lastSeen <= filter.toDate!);
    }

    if (filter.minCount) {
      errors = errors.filter((e) => e.count >= filter.minCount!);
    }

    if (filter.search) {
      const query = filter.search.toLowerCase();
      errors = errors.filter(
        (e) => e.message.toLowerCase().includes(query) || e.type.toLowerCase().includes(query)
      );
    }

    return errors;
  }

  /**
   * Get error statistics
   *
   * @returns Statistics object
   */
  getStats(): ErrorStats {
    const errors = Array.from(this.errors.values());

    const totalErrors = errors.reduce((sum, e) => sum + e.count, 0);
    const uniqueErrors = errors.length;
    const criticalErrors = errors.filter((e) => e.severity === 'critical').length;

    // Calculate error rate (errors per minute)
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentErrors = errors.reduce((sum, error) => {
      const recentOccurrences = error.occurrences.filter((o) => o.timestamp > oneHourAgo);
      return sum + recentOccurrences.length;
    }, 0);

    const errorRate = recentErrors / 60;

    // Get top errors by count
    const topErrors = errors.sort((a, b) => b.count - a.count).slice(0, 10);

    return {
      totalErrors,
      uniqueErrors,
      errorRate,
      topErrors,
      criticalErrors,
    };
  }

  /**
   * Search errors by query string
   *
   * @param query - Search query
   * @returns Matching errors
   */
  searchErrors(query: string): AggregatedError[] {
    return this.listErrors({ search: query });
  }

  /**
   * Mark error as resolved
   *
   * @param hash - Error hash
   */
  markResolved(hash: string): void {
    const error = this.errors.get(hash);
    if (error) {
      error.status = 'resolved';

      if (this.storage) {
        void this.storage.update(hash, { status: 'resolved' });
      }
    }
  }

  /**
   * Mark error as ignored
   *
   * @param hash - Error hash
   */
  markIgnored(hash: string): void {
    const error = this.errors.get(hash);
    if (error) {
      error.status = 'ignored';

      if (this.storage) {
        void this.storage.update(hash, { status: 'ignored' });
      }
    }
  }

  /**
   * Clear all errors
   */
  clearAll(): void {
    this.errors.clear();

    if (this.storage) {
      void this.storage.clear();
    }
  }

  /**
   * Export errors to JSON format
   *
   * @param format - Export format (json or csv)
   * @returns Serialized errors
   */
  exportErrors(format: 'json' | 'csv' = 'json'): string {
    const errors = Array.from(this.errors.values());

    if (format === 'json') {
      return JSON.stringify(
        errors,
        (_key, value) => {
          // Convert Map to object for JSON serialization
          if (value instanceof Map) {
            return Object.fromEntries(value);
          }
          return value;
        },
        2
      );
    }

    // CSV format
    const headers = [
      'Hash',
      'Type',
      'Message',
      'Count',
      'Severity',
      'Status',
      'First Seen',
      'Last Seen',
    ];
    const rows = errors.map((e) => [
      e.hash,
      e.type,
      e.message.replace(/"/g, '""'), // Escape quotes
      e.count,
      e.severity,
      e.status,
      new Date(e.firstSeen).toISOString(),
      new Date(e.lastSeen).toISOString(),
    ]);

    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join(
      '\n'
    );
  }

  /**
   * Get current error count
   *
   * @returns Number of unique errors
   */
  getCount(): number {
    return this.errors.size;
  }

  /**
   * Set storage backend
   *
   * @param storage - Storage backend
   */
  setStorage(storage: ErrorStorage): void {
    this.storage = storage;
  }

  // =========================================================================
  // Public API for tests
  // =========================================================================

  /**
   * Get all tracked errors
   */
  getAllErrors(): AggregatedError[] {
    return Array.from(this.errors.values());
  }

  /**
   * Get error groups (alias for getAllErrors)
   */
  getErrorGroups(): AggregatedError[] {
    return this.getAllErrors();
  }

  /**
   * Get error statistics
   */
  getStatistics(): {
    totalErrors: number;
    totalGroups: number;
    activeErrors: number;
    resolvedErrors: number;
    criticalErrors: number;
    recentErrors: number;
  } {
    const allErrors = this.getAllErrors();
    const totalGroups = allErrors.length;
    const totalErrors = allErrors.reduce((sum, e) => sum + e.count, 0);
    const activeErrors = allErrors.filter((e) => e.status === 'active').length;
    const resolvedErrors = allErrors.filter((e) => e.status === 'resolved').length;
    const criticalErrors = allErrors.filter((e) => e.severity === 'critical').length;

    // Count recent errors (last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentErrors = allErrors.filter((e) => e.lastSeen > oneHourAgo).length;

    return {
      totalErrors,
      totalGroups,
      activeErrors,
      resolvedErrors,
      criticalErrors,
      recentErrors,
    };
  }
}

/**
 * Error tracked event
 * @event ErrorAggregator#error-tracked
 * @type {{ hash: string, error: AggregatedError }}
 */

/**
 * Error spike detected event
 * @event ErrorAggregator#error-spike
 * @type {AggregatedError}
 */

/**
 * New error type event
 * @event ErrorAggregator#new-error-type
 * @type {AggregatedError}
 */
