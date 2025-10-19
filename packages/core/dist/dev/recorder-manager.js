/**
 * Request Recorder Manager
 *
 * Manages request recording, storage, and replay functionality
 */
import { EventEmitter } from 'node:events';
import { MemoryStorage, generateRequestId, extractBody, sanitizeHeaders, } from './recorder.js';
import { FileStorage } from './file-storage.js';
import { RequestReplayEngine } from './recorder-replay.js';
import { TestGenerator } from './recorder-test-gen.js';
import { createDevLogger } from './logger.js';
export class RequestRecorder extends EventEmitter {
    storage;
    options;
    recording = false;
    replayEngine;
    testGenerator;
    logger = createDevLogger({ level: 'info' });
    constructor(options = {}) {
        super();
        this.options = {
            enabled: options.enabled !== false,
            maxRequests: options.maxRequests || 1000,
            recordBody: options.recordBody !== false,
            recordResponse: options.recordResponse !== false,
            sanitizeHeaders: options.sanitizeHeaders !== false,
            excludePaths: options.excludePaths || [],
        };
        // Initialize storage based on type
        if (typeof options.storage === 'object') {
            // Custom storage provided
            this.storage = options.storage;
        }
        else if (options.storage === 'file') {
            // File-based storage
            const fileConfig = options.fileStorage || {};
            this.storage = new FileStorage({
                maxRequests: this.options.maxRequests,
                ...fileConfig,
            }, this.logger);
            // FileStorage will be initialized when start() is called
        }
        else {
            // Default to memory storage
            this.storage = new MemoryStorage(this.options.maxRequests);
        }
    }
    /**
     * Start recording requests
     */
    async start() {
        if (this.recording)
            return;
        // Initialize storage if it has an initialize method (FileStorage)
        if ('initialize' in this.storage && typeof this.storage.initialize === 'function') {
            await this.storage.initialize();
        }
        this.recording = true;
        this.emit('started');
    }
    /**
     * Stop recording requests
     */
    async stop() {
        if (!this.recording)
            return;
        this.recording = false;
        this.emit('stopped');
    }
    /**
     * Check if recording is enabled
     */
    isRecording() {
        return this.recording && this.options.enabled;
    }
    /**
     * Record an incoming request
     */
    async recordRequest(req, startTime) {
        if (!this.isRecording())
            return null;
        const url = req.url || '/';
        const path = url.split('?')[0] || '/';
        // Check if path is excluded
        if (this.shouldExclude(path))
            return null;
        const id = generateRequestId();
        // Parse query string
        const queryString = url.split('?')[1] || '';
        const query = {};
        if (queryString) {
            const params = new URLSearchParams(queryString);
            params.forEach((value, key) => {
                query[key] = value;
            });
        }
        // Extract headers
        let headers = { ...req.headers };
        if (this.options.sanitizeHeaders) {
            headers = sanitizeHeaders(headers);
        }
        // Extract body if enabled
        let body;
        if (this.options.recordBody && req.method !== 'GET' && req.method !== 'HEAD') {
            try {
                body = await extractBody(req);
            }
            catch {
                body = '[Error reading body]';
            }
        }
        const meta = {};
        if (req.socket.remoteAddress)
            meta.ip = req.socket.remoteAddress;
        if (req.headers['user-agent'])
            meta.userAgent = req.headers['user-agent'];
        if (req.headers['content-type'])
            meta.contentType = req.headers['content-type'];
        const recorded = {
            id,
            timestamp: startTime,
            method: req.method || 'GET',
            url,
            headers,
            query,
            params: {}, // Will be set by application
            body,
            meta,
        };
        await this.storage.store(recorded);
        this.emit('recorded', { id, request: recorded });
        return id;
    }
    /**
     * Update recorded request with response data
     */
    async recordResponse(id, res, body, endTime) {
        if (!this.isRecording())
            return;
        const request = await this.storage.get(id);
        if (!request)
            return;
        // Record response
        const response = {
            statusCode: res.statusCode,
            headers: { ...res.getHeaders() },
            body: this.options.recordResponse ? body : undefined,
            timestamp: endTime,
        };
        request.response = response;
        request.duration = endTime - request.timestamp;
        await this.storage.store(request);
        this.emit('response-recorded', { id, request });
    }
    /**
     * Get a recorded request by ID
     */
    async getRequest(id) {
        const result = this.storage.get(id);
        // Handle both sync and async storage implementations
        return result instanceof Promise ? await result : result;
    }
    /**
     * Get all recorded requests
     */
    async getAllRequests() {
        return this.storage.getAll();
    }
    /**
     * Get recent requests
     */
    async getRecentRequests(limit = 50) {
        return this.storage.getRecent(limit);
    }
    /**
     * Clear all recorded requests
     */
    async clearRequests() {
        await this.storage.clear();
        this.emit('cleared');
    }
    /**
     * Get total request count
     */
    async getCount() {
        return this.storage.count();
    }
    /**
     * Delete a specific request
     */
    async deleteRequest(id) {
        const deleted = await this.storage.delete(id);
        if (deleted) {
            this.emit('deleted', { id });
        }
        return deleted;
    }
    /**
     * Export recorded requests as JSON
     */
    async exportRequests() {
        const requests = await this.storage.getAll();
        return JSON.stringify(requests, null, 2);
    }
    /**
     * Import recorded requests from JSON
     */
    async importRequests(json) {
        try {
            const requests = JSON.parse(json);
            let imported = 0;
            for (const request of requests) {
                await this.storage.store(request);
                imported++;
            }
            this.emit('imported', { count: imported });
            return imported;
        }
        catch (error) {
            throw new Error('Failed to import requests: Invalid JSON');
        }
    }
    /**
     * Check if a path should be excluded from recording
     */
    shouldExclude(path) {
        return this.options.excludePaths.some((pattern) => {
            // Simple pattern matching (exact or wildcard)
            if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                return regex.test(path);
            }
            return path === pattern || path.startsWith(pattern);
        });
    }
    /**
     * Get recorder statistics
     */
    async getStats() {
        return {
            totalRecorded: await this.getCount(),
            recording: this.recording,
            storageType: this.storage instanceof MemoryStorage ? 'memory' : 'custom',
            maxRequests: this.options.maxRequests,
        };
    }
    // =========================================================================
    // Synchronous API (for MemoryStorage only)
    // =========================================================================
    /**
     * Get all recorded requests (synchronous)
     * Only available with MemoryStorage
     */
    getAll() {
        if (this.storage instanceof MemoryStorage) {
            return this.storage.getAll();
        }
        throw new Error('Synchronous getAll() only available with MemoryStorage');
    }
    /**
     * Get a recorded request by ID (synchronous)
     * Only available with MemoryStorage
     */
    get(id) {
        if (this.storage instanceof MemoryStorage) {
            return this.storage.get(id) || undefined;
        }
        throw new Error('Synchronous get() only available with MemoryStorage');
    }
    /**
     * Filter recorded requests by criteria (synchronous)
     */
    filter(query) {
        const all = this.getAll();
        return all.filter((req) => {
            if (query.method && req.method !== query.method)
                return false;
            if (query.status && req.response?.statusCode !== query.status)
                return false;
            if (query.path && !req.url.includes(query.path))
                return false;
            if (query.minDuration && (!req.duration || req.duration < query.minDuration))
                return false;
            if (query.maxDuration && (!req.duration || req.duration > query.maxDuration))
                return false;
            return true;
        });
    }
    /**
     * Query recorded requests (alias for filter)
     */
    query(criteria) {
        return this.filter(criteria);
    }
    /**
     * Get the replay engine
     * Note: Returns a simple replay engine without logger for sync API
     */
    getReplayEngine() {
        if (!this.replayEngine) {
            // Create a minimal logger for the replay engine
            const logger = createDevLogger({ level: 'info' });
            this.replayEngine = new RequestReplayEngine(logger, this);
        }
        return this.replayEngine;
    }
    /**
     * Get the test generator
     * Note: Returns a simple test generator without logger for sync API
     */
    getTestGenerator() {
        if (!this.testGenerator) {
            // Create a minimal logger for the test generator
            const logger = createDevLogger({ level: 'info' });
            this.testGenerator = new TestGenerator(logger);
        }
        return this.testGenerator;
    }
}
/**
 * Create a request recorder instance
 */
export function createRequestRecorder(options) {
    return new RequestRecorder(options);
}
//# sourceMappingURL=recorder-manager.js.map