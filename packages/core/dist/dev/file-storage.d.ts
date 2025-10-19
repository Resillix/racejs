/**
 * File-based Storage for RaceJS DevTools
 *
 * Stores all dev mode data in .racejs/ directory:
 * - .racejs/requests/       - Recorded HTTP requests
 * - .racejs/errors/         - Error logs
 * - .racejs/performance/    - Performance metrics
 * - .racejs/config.json     - Configuration
 *
 * Benefits:
 * - Persists across server restarts
 * - Fast lookups using file IDs
 * - Automatic cleanup of old data
 * - No memory bloat
 */
import type { RecordedRequest, RecorderStorage } from './recorder.js';
import type { DevLogger } from './logger.js';
export interface FileStorageConfig {
    /** Base directory for storage (default: .racejs) */
    baseDir?: string;
    /** Maximum number of requests to keep */
    maxRequests?: number;
    /** Maximum age of requests in milliseconds (default: 24 hours) */
    maxAge?: number;
    /** Enable compression for old requests */
    compress?: boolean;
    /** Cleanup interval in milliseconds (default: 5 minutes) */
    cleanupInterval?: number;
}
export interface StorageStats {
    totalRequests: number;
    totalSize: number;
    oldestRequest: number | null;
    newestRequest: number | null;
}
/**
 * File-based storage implementation
 * Stores each request as a separate JSON file for fast access
 */
export declare class FileStorage implements RecorderStorage {
    private baseDir;
    private requestsDir;
    private indexFile;
    private config;
    private logger;
    private cleanupInterval?;
    private index;
    private initialized;
    constructor(config: FileStorageConfig, logger: DevLogger);
    /**
     * Initialize storage directories
     */
    initialize(): Promise<void>;
    /**
     * Store a request
     */
    store(request: RecordedRequest): Promise<void>;
    /**
     * Get a request by ID
     */
    get(id: string): Promise<RecordedRequest | null>;
    /**
     * Get all requests
     */
    getAll(): Promise<RecordedRequest[]>;
    /**
     * Get recent requests
     */
    getRecent(limit: number): Promise<RecordedRequest[]>;
    /**
     * Clear all requests
     */
    clear(): Promise<void>;
    /**
     * Delete a specific request
     */
    delete(id: string): Promise<boolean>;
    /**
     * Get request count
     */
    count(): number;
    /**
     * Get storage statistics
     */
    getStats(): Promise<StorageStats>;
    /**
     * Cleanup old requests
     */
    private cleanup;
    /**
     * Evict oldest request (FIFO)
     */
    private evictOldest;
    /**
     * Load index from file
     */
    private loadIndex;
    /**
     * Save index to file
     */
    private saveIndex;
    /**
     * Ensure directory exists
     */
    private ensureDir;
    /**
     * Cleanup and close storage
     */
    close(): Promise<void>;
    /**
     * Destroy storage (for testing)
     */
    destroy(): Promise<void>;
}
//# sourceMappingURL=file-storage.d.ts.map