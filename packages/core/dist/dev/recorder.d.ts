/**
 * Request Recorder - Time-travel debugging for HTTP requests
 *
 * Records all incoming requests with full details for replay and analysis
 */
import { IncomingMessage } from 'node:http';
export interface RecordedRequest {
    /** Unique ID for this request */
    id: string;
    /** Timestamp when request was received */
    timestamp: number;
    /** HTTP method */
    method: string;
    /** Request URL */
    url: string;
    /** Request headers */
    headers: Record<string, string | string[] | undefined>;
    /** Query parameters */
    query: Record<string, any>;
    /** Route parameters */
    params: Record<string, string>;
    /** Request body (if recorded) */
    body?: any;
    /** Response details */
    response?: RecordedResponse;
    /** Request duration in milliseconds */
    duration?: number;
    /** Request metadata */
    meta: {
        /** IP address */
        ip?: string;
        /** User agent */
        userAgent?: string;
        /** Content type */
        contentType?: string;
    };
}
export interface RecordedResponse {
    /** HTTP status code */
    statusCode: number;
    /** Response headers */
    headers: Record<string, string | string[] | number | undefined>;
    /** Response body (if recorded) */
    body?: any;
    /** Response timestamp */
    timestamp: number;
}
export interface RecorderStorage {
    /** Store a recorded request */
    store(request: RecordedRequest): Promise<void> | void;
    /** Get a recorded request by ID */
    get(id: string): Promise<RecordedRequest | null> | RecordedRequest | null;
    /** Get all recorded requests */
    getAll(): Promise<RecordedRequest[]> | RecordedRequest[];
    /** Get recent requests (limit) */
    getRecent(limit: number): Promise<RecordedRequest[]> | RecordedRequest[];
    /** Clear all recorded requests */
    clear(): Promise<void> | void;
    /** Get total count */
    count(): Promise<number> | number;
    /** Delete a specific request */
    delete(id: string): Promise<boolean> | boolean;
}
/**
 * In-memory storage implementation
 * Includes automatic cleanup of old requests
 */
export declare class MemoryStorage implements RecorderStorage {
    private requests;
    private maxRequests;
    private maxAge;
    private cleanupInterval?;
    constructor(maxRequests?: number, maxAge?: number);
    /**
     * Clean up requests older than maxAge
     */
    private cleanupOldRequests;
    /**
     * Stop cleanup interval (for graceful shutdown)
     */
    destroy(): void;
    store(request: RecordedRequest): void;
    get(id: string): RecordedRequest | null;
    getAll(): RecordedRequest[];
    getRecent(limit: number): RecordedRequest[];
    clear(): void;
    count(): number;
    delete(id: string): boolean;
}
/**
 * Generate unique request ID
 */
export declare function generateRequestId(): string;
/**
 * Extract request body from IncomingMessage
 */
export declare function extractBody(req: IncomingMessage): Promise<any>;
/**
 * Sanitize headers (remove sensitive data)
 */
export declare function sanitizeHeaders(headers: Record<string, string | string[] | undefined>, sensitiveKeys?: string[]): Record<string, string | string[] | undefined>;
//# sourceMappingURL=recorder.d.ts.map