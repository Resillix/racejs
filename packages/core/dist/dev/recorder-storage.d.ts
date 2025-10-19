/**
 * Storage Implementations for Request Recorder
 *
 * Multiple storage backends using Strategy pattern:
 * - MemoryStorage: Fast development storage (default)
 * - FileStorage: Simple, backup-friendly
 */
import { RecordedRequest, RecorderStorage } from './recorder.js';
import type { DevLogger } from './logger.js';
/**
 * Storage configuration interface
 */
export interface StorageConfig {
    /** Storage type */
    type: 'memory' | 'file';
    /** Storage-specific options */
    options?: {
        /** File storage directory */
        directory?: string;
        /** Maximum number of requests to store */
        maxRequests?: number;
    };
}
/**
 * Storage query interface for advanced filtering
 */
export interface StorageQuery {
    /** Filter by HTTP method */
    method?: string;
    /** Filter by URL pattern */
    urlPattern?: string;
    /** Filter by status code */
    statusCode?: number;
    /** Filter by time range */
    timeRange?: {
        start: number;
        end: number;
    };
    /** Limit number of results */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
    /** Sort by field */
    sortBy?: 'timestamp' | 'duration' | 'statusCode';
    /** Sort direction */
    sortOrder?: 'asc' | 'desc';
}
/**
 * Enhanced storage interface with querying capabilities
 */
export interface AdvancedRecorderStorage extends RecorderStorage {
    /** Query requests with filters */
    query(query: StorageQuery): Promise<RecordedRequest[]>;
    /** Count total requests with optional query */
    count(query?: Partial<StorageQuery>): Promise<number>;
    /** Get storage statistics */
    getStats(): Promise<{
        totalRequests: number;
        oldestRequest?: number | undefined;
        newestRequest?: number | undefined;
        storageSize?: number | undefined;
    }>;
    /** Close/cleanup storage */
    close(): Promise<void>;
}
/**
 * Memory Storage - Default implementation
 * Fast but not persistent, good for development
 */
export declare class MemoryStorage implements AdvancedRecorderStorage {
    private requests;
    private maxRequests;
    private logger;
    constructor(config: StorageConfig, logger: DevLogger);
    store(request: RecordedRequest): Promise<void>;
    get(id: string): Promise<RecordedRequest | null>;
    getAll(): Promise<RecordedRequest[]>;
    getRecent(limit: number): Promise<RecordedRequest[]>;
    clear(): Promise<void>;
    delete(id: string): Promise<boolean>;
    count(query?: Partial<StorageQuery>): Promise<number>;
    query(query: StorageQuery): Promise<RecordedRequest[]>;
    getStats(): Promise<{
        totalRequests: number;
        oldestRequest: number | undefined;
        newestRequest: number | undefined;
    }>;
    close(): Promise<void>;
}
/**
 * File Storage - Simple JSON file persistence
 * Good for small projects and easy debugging
 */
export declare class FileStorage implements AdvancedRecorderStorage {
    private filePath;
    private requests;
    private logger;
    private maxRequests;
    private writeScheduled;
    constructor(config: StorageConfig, logger: DevLogger);
    private loadFromFile;
    private saveToFile;
    store(request: RecordedRequest): Promise<void>;
    get(id: string): Promise<RecordedRequest | null>;
    getAll(): Promise<RecordedRequest[]>;
    getRecent(limit: number): Promise<RecordedRequest[]>;
    clear(): Promise<void>;
    delete(id: string): Promise<boolean>;
    count(query?: Partial<StorageQuery>): Promise<number>;
    query(query: StorageQuery): Promise<RecordedRequest[]>;
    getStats(): Promise<{
        totalRequests: number;
        oldestRequest: number | undefined;
        newestRequest: number | undefined;
        storageSize: number;
    }>;
    close(): Promise<void>;
}
/**
 * Storage Factory - Creates appropriate storage instance
 */
export declare function createStorage(config: StorageConfig, logger: DevLogger): AdvancedRecorderStorage;
//# sourceMappingURL=recorder-storage.d.ts.map