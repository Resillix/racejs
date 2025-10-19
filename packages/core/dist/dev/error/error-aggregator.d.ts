/**
 * @fileoverview ErrorAggregator - Groups and tracks errors
 *
 * Groups identical errors by stack trace hash, tracks frequency,
 * detects trends, and provides error statistics.
 *
 * @module dev/error/error-aggregator
 */
import { EventEmitter } from 'node:events';
import type { AggregatedError, ErrorContext, ErrorFilter, ErrorStats, ErrorStorage } from './types.js';
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
export declare class ErrorAggregator extends EventEmitter {
    private errors;
    private storage?;
    private maxErrors;
    private maxOccurrences;
    /**
     * Creates a new ErrorAggregator
     *
     * @param storage - Optional storage backend
     * @param maxErrors - Maximum number of unique errors to track (default: 1000)
     * @param maxOccurrences - Maximum occurrences per error (default: 100)
     */
    constructor(storage?: ErrorStorage, maxErrors?: number, maxOccurrences?: number);
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
    track(error: Error, context: ErrorContext): string;
    /**
     * Generate hash for error based on stack trace
     *
     * Normalizes the stack trace by removing line numbers and timestamps
     * to group similar errors together.
     *
     * @param error - Error to hash
     * @returns Hash string
     */
    private generateHash;
    /**
     * Determine error severity based on error type and context
     *
     * @param error - Error object
     * @param context - Error context
     * @returns Severity level
     */
    private determineSeverity;
    /**
     * Detect error trend (increasing/stable/decreasing)
     *
     * Compares recent error rate to previous rate to determine trend.
     *
     * @param error - Aggregated error
     * @returns Trend direction
     */
    private detectTrend;
    /**
     * Check if error is experiencing a spike (10x normal rate)
     *
     * @param error - Aggregated error
     * @returns True if spike detected
     */
    private checkForSpike;
    /**
     * Evict oldest error to maintain size limit
     */
    private evictOldest;
    /**
     * Get error by hash
     *
     * @param hash - Error hash
     * @returns Aggregated error or null
     */
    getError(hash: string): AggregatedError | null;
    /**
     * List errors with optional filtering
     *
     * @param filter - Optional filter criteria
     * @returns Array of aggregated errors
     */
    listErrors(filter?: ErrorFilter): AggregatedError[];
    /**
     * Get error statistics
     *
     * @returns Statistics object
     */
    getStats(): ErrorStats;
    /**
     * Search errors by query string
     *
     * @param query - Search query
     * @returns Matching errors
     */
    searchErrors(query: string): AggregatedError[];
    /**
     * Mark error as resolved
     *
     * @param hash - Error hash
     */
    markResolved(hash: string): void;
    /**
     * Mark error as ignored
     *
     * @param hash - Error hash
     */
    markIgnored(hash: string): void;
    /**
     * Clear all errors
     */
    clearAll(): void;
    /**
     * Export errors to JSON format
     *
     * @param format - Export format (json or csv)
     * @returns Serialized errors
     */
    exportErrors(format?: 'json' | 'csv'): string;
    /**
     * Get current error count
     *
     * @returns Number of unique errors
     */
    getCount(): number;
    /**
     * Set storage backend
     *
     * @param storage - Storage backend
     */
    setStorage(storage: ErrorStorage): void;
    /**
     * Get all tracked errors
     */
    getAllErrors(): AggregatedError[];
    /**
     * Get error groups (alias for getAllErrors)
     */
    getErrorGroups(): AggregatedError[];
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
    };
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
//# sourceMappingURL=error-aggregator.d.ts.map