/**
 * Request Recorder Manager
 *
 * Manages request recording, storage, and replay functionality
 */
import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { type RecordedRequest, type RecorderStorage } from './recorder.js';
import { type FileStorageConfig } from './file-storage.js';
import { RequestReplayEngine } from './recorder-replay.js';
import { TestGenerator } from './recorder-test-gen.js';
export interface RequestRecorderOptions {
    /** Enable recording */
    enabled?: boolean;
    /** Maximum number of requests to keep */
    maxRequests?: number;
    /** Storage backend */
    storage?: 'memory' | 'file' | RecorderStorage;
    /** File storage configuration (when storage='file') */
    fileStorage?: FileStorageConfig;
    /** Record request bodies */
    recordBody?: boolean;
    /** Record response bodies */
    recordResponse?: boolean;
    /** Sanitize sensitive headers */
    sanitizeHeaders?: boolean;
    /** Paths to exclude from recording */
    excludePaths?: string[];
}
export declare class RequestRecorder extends EventEmitter {
    private storage;
    private options;
    private recording;
    private replayEngine?;
    private testGenerator?;
    private logger;
    constructor(options?: RequestRecorderOptions);
    /**
     * Start recording requests
     */
    start(): Promise<void>;
    /**
     * Stop recording requests
     */
    stop(): Promise<void>;
    /**
     * Check if recording is enabled
     */
    isRecording(): boolean;
    /**
     * Record an incoming request
     */
    recordRequest(req: IncomingMessage, startTime: number): Promise<string | null>;
    /**
     * Update recorded request with response data
     */
    recordResponse(id: string, res: ServerResponse, body: any, endTime: number): Promise<void>;
    /**
     * Get a recorded request by ID
     */
    getRequest(id: string): Promise<RecordedRequest | null>;
    /**
     * Get all recorded requests
     */
    getAllRequests(): Promise<RecordedRequest[]>;
    /**
     * Get recent requests
     */
    getRecentRequests(limit?: number): Promise<RecordedRequest[]>;
    /**
     * Clear all recorded requests
     */
    clearRequests(): Promise<void>;
    /**
     * Get total request count
     */
    getCount(): Promise<number>;
    /**
     * Delete a specific request
     */
    deleteRequest(id: string): Promise<boolean>;
    /**
     * Export recorded requests as JSON
     */
    exportRequests(): Promise<string>;
    /**
     * Import recorded requests from JSON
     */
    importRequests(json: string): Promise<number>;
    /**
     * Check if a path should be excluded from recording
     */
    private shouldExclude;
    /**
     * Get recorder statistics
     */
    getStats(): Promise<{
        totalRecorded: number;
        recording: boolean;
        storageType: string;
        maxRequests: number;
    }>;
    /**
     * Get all recorded requests (synchronous)
     * Only available with MemoryStorage
     */
    getAll(): RecordedRequest[];
    /**
     * Get a recorded request by ID (synchronous)
     * Only available with MemoryStorage
     */
    get(id: string): RecordedRequest | undefined;
    /**
     * Filter recorded requests by criteria (synchronous)
     */
    filter(query: {
        method?: string;
        path?: string;
        status?: number;
        minDuration?: number;
        maxDuration?: number;
    }): RecordedRequest[];
    /**
     * Query recorded requests (alias for filter)
     */
    query(criteria: any): RecordedRequest[];
    /**
     * Get the replay engine
     * Note: Returns a simple replay engine without logger for sync API
     */
    getReplayEngine(): RequestReplayEngine;
    /**
     * Get the test generator
     * Note: Returns a simple test generator without logger for sync API
     */
    getTestGenerator(): TestGenerator;
}
/**
 * Create a request recorder instance
 */
export declare function createRequestRecorder(options?: RequestRecorderOptions): RequestRecorder;
//# sourceMappingURL=recorder-manager.d.ts.map