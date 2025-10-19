/**
 * Error Storage - Persistence Layer for Aggregated Errors
 *
 * Provides storage interface and implementations for error persistence:
 * - MemoryErrorStorage (default, fast, volatile)
 * - FileErrorStorage (persistent, simple)
 * - Can be extended with Redis, SQLite, etc.
 *
 * Pattern: Strategy Pattern - different storage backends
 */
import { AggregatedError, ErrorFilter } from './types';
/**
 * ErrorStorage interface - defines contract for error persistence
 * Pattern: Strategy Pattern - allows different storage implementations
 */
export interface ErrorStorage {
    /**
     * Store an aggregated error
     */
    store(error: AggregatedError): Promise<void>;
    /**
     * Find an error by its hash
     */
    find(hash: string): Promise<AggregatedError | null>;
    /**
     * List errors with optional filtering
     */
    list(filter?: ErrorFilter): Promise<AggregatedError[]>;
    /**
     * Update an existing error
     */
    update(hash: string, updates: Partial<AggregatedError>): Promise<void>;
    /**
     * Delete an error
     */
    delete(hash: string): Promise<void>;
    /**
     * Clear all errors
     */
    clear(): Promise<void>;
    /**
     * Get total error count
     */
    count(): Promise<number>;
}
/**
 * In-memory error storage (default)
 *
 * Features:
 * - Fast (no I/O)
 * - Volatile (lost on restart)
 * - LRU eviction when limit reached
 * - Thread-safe (single-process)
 */
export declare class MemoryErrorStorage implements ErrorStorage {
    private errors;
    private maxErrors;
    /**
     * Create new memory storage
     *
     * @param maxErrors - Maximum errors to store (default: 1000)
     */
    constructor(maxErrors?: number);
    /**
     * Store error in memory
     */
    store(error: AggregatedError): Promise<void>;
    /**
     * Find error by hash
     */
    find(hash: string): Promise<AggregatedError | null>;
    /**
     * List all errors with optional filtering
     */
    list(filter?: ErrorFilter): Promise<AggregatedError[]>;
    /**
     * Update an error
     */
    update(hash: string, updates: Partial<AggregatedError>): Promise<void>;
    /**
     * Delete an error
     */
    delete(hash: string): Promise<void>;
    /**
     * Clear all errors
     */
    clear(): Promise<void>;
    /**
     * Get error count
     */
    count(): Promise<number>;
    /**
     * Get all errors (for export)
     */
    getAll(): AggregatedError[];
}
/**
 * File-based error storage (persistent)
 *
 * Features:
 * - Persistent (survives restart)
 * - Simple (JSON file)
 * - Slower than memory
 * - Good for development
 */
export declare class FileErrorStorage implements ErrorStorage {
    private filePath;
    private cache;
    private isDirty;
    private saveInterval;
    /**
     * Create new file storage
     *
     * @param filePath - Path to JSON file (default: .racejs/errors.json)
     */
    constructor(filePath?: string);
    /**
     * Load errors from file on startup
     */
    private loadFromFile;
    /**
     * Save errors to file
     */
    private saveToFile;
    /**
     * Store error
     */
    store(error: AggregatedError): Promise<void>;
    /**
     * Find error
     */
    find(hash: string): Promise<AggregatedError | null>;
    /**
     * List errors with filtering (same as MemoryErrorStorage)
     */
    list(filter?: ErrorFilter): Promise<AggregatedError[]>;
    /**
     * Update error
     */
    update(hash: string, updates: Partial<AggregatedError>): Promise<void>;
    /**
     * Delete error
     */
    delete(hash: string): Promise<void>;
    /**
     * Clear all errors
     */
    clear(): Promise<void>;
    /**
     * Get error count
     */
    count(): Promise<number>;
    /**
     * Cleanup - save and stop auto-save interval
     */
    destroy(): void;
}
/**
 * Create default error storage based on environment
 *
 * @param type - Storage type ('memory' or 'file')
 * @param options - Storage-specific options
 * @returns ErrorStorage instance
 */
export declare function createErrorStorage(type?: 'memory' | 'file', options?: any): ErrorStorage;
//# sourceMappingURL=error-storage.d.ts.map