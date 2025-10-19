/**
 * Request Replay Engine
 *
 * Time-travel debugging: Replay any recorded request with exact conditions
 * Edit requests before replay, compare responses, generate tests
 */
import { EventEmitter } from 'node:events';
import type { RecordedRequest, RecordedResponse } from './recorder.js';
import type { RequestRecorder } from './recorder-manager.js';
import type { DevLogger } from './logger.js';
export interface ReplayOptions {
    /** Request ID to replay */
    requestId: string;
    /** Mock mode - don't send real request */
    mockMode?: boolean;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Override headers */
    headers?: Record<string, string>;
    /** Override body */
    body?: any;
    /** Override query parameters */
    query?: Record<string, string>;
    /** Base URL override (for different environments) */
    baseUrl?: string;
}
export interface ReplayResult {
    /** Original request */
    originalRequest: RecordedRequest;
    /** New response from replay */
    replayResponse: RecordedResponse;
    /** Timing information */
    timing: {
        startTime: number;
        endTime: number;
        duration: number;
    };
    /** Whether request was mocked */
    mocked: boolean;
    /** Any errors during replay */
    error?: string;
}
export interface ResponseComparison {
    /** Are responses identical */
    identical: boolean;
    /** Differences found */
    differences: {
        /** Status code changed */
        statusCode?: {
            original: number;
            replayed: number;
        };
        /** Headers changed */
        headers?: {
            added: Record<string, string>;
            removed: string[];
            modified: Record<string, {
                original: string;
                replayed: string;
            }>;
        };
        /** Body changed */
        body?: {
            type: 'identical' | 'different' | 'type-changed';
            original: any;
            replayed: any;
            diff?: string;
        };
    };
    /** Summary of changes */
    summary: string;
}
export interface RequestReplayEngineEvents {
    'replay-started': [requestId: string, options: ReplayOptions];
    'replay-completed': [result: ReplayResult];
    'replay-failed': [requestId: string, error: Error];
    'comparison-completed': [comparison: ResponseComparison];
}
/**
 * Request Replay Engine
 *
 * Single Responsibility: Handles ONLY replay logic
 * - Replay recorded requests with exact conditions
 * - Edit requests before replay
 * - Compare responses before/after
 * - Generate cURL commands for external testing
 */
export declare class RequestReplayEngine extends EventEmitter {
    private logger;
    private requestStore;
    private recorder?;
    private serverPort?;
    private serverHost;
    constructor(logger: DevLogger, recorder?: RequestRecorder);
    /**
     * Set the server port for replay requests
     * This should be called when the server starts listening
     */
    setServerPort(port: number, host?: string): void;
    /**
     * Get the current server port
     */
    getServerPort(): number | undefined;
    /**
     * Add a recorded request to the replay store
     */
    addRequest(request: RecordedRequest): void;
    /**
     * Remove a request from the replay store
     */
    removeRequest(requestId: string): boolean;
    /**
     * Get a recorded request by ID from either the recorder or internal store
     */
    getRequest(requestId: string): Promise<RecordedRequest | undefined>;
    /**
     * Replay a recorded request (simple API)
     */
    replay(requestId: string, options?: Partial<Omit<ReplayOptions, 'requestId'>>): Promise<ReplayResult>;
    /**
     * Replay a recorded request
     */
    replayRequest(options: ReplayOptions): Promise<ReplayResult>;
    /**
     * Compare two responses (original vs replayed)
     */
    compareResponses(original: RecordedResponse, replayed: RecordedResponse): ResponseComparison;
    /**
     * Generate cURL command for a request
     */
    generateCurl(request: RecordedRequest, options?: Partial<ReplayOptions>): string;
    /**
     * Generate automated test from a request
     */
    generateTest(request: RecordedRequest, framework?: 'vitest' | 'jest'): string;
    /**
     * Build replay request with overrides
     */
    private buildReplayRequest;
    /**
     * Execute actual HTTP request replay
     */
    private executeReplay;
    /**
     * Create mock response (returns original)
     */
    private createMockResponse;
    /**
     * Create error response
     */
    private createErrorResponse;
    /**
     * Compare headers between responses
     */
    private compareHeaders;
    /**
     * Compare response bodies
     */
    private compareBodies;
    /**
     * Generate comparison summary
     */
    private generateComparisonSummary;
    /**
     * Generate simple JSON diff (basic implementation)
     */
    private generateJsonDiff;
    /**
     * Generate simple text diff
     */
    private generateTextDiff;
    /**
     * Generate Vitest test
     */
    private generateVitestTest;
    /**
     * Generate Jest test
     */
    private generateJestTest;
    /**
     * Sanitize headers for replay (remove sensitive data but keep necessary headers)
     */
    private sanitizeHeaders;
    /**
     * Check if header is sensitive
     */
    private isSensitiveHeader;
    /**
     * Parse response body based on content type
     */
    private parseBody;
}
/**
 * Create a request replay engine instance
 */
export declare function createRequestReplayEngine(logger: DevLogger): RequestReplayEngine;
//# sourceMappingURL=recorder-replay.d.ts.map